import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";
import cleanProductVariantInput from "../utils/cleanProductVariantInput.js";

const inputSchema = new SimpleSchema({
  shopId: String,
  variant: {
    type: Object,
    blackbox: true
  },
  variantId: String
});

/**
 * @method updateProductVariant
 * @summary Updates various fields on a product variant
 * @param {Object} context -  an object containing the per-request state
 * @param {Object} input - Input arguments for the bulk operation
 * @para§m {Object} input.variant - updated variant fields
 * @param {String} input.variantId - variantId of product to update
 * @param {String} input.shopId - shopId of shop product belongs to
 * @return {Promise<Object>} updated ProductVariant
 */
export default async function updateProductVariant(context, input) {
  inputSchema.validate(input);
  const { appEvents, collections, simpleSchemas } = context;
  const { ProductVariant } = simpleSchemas;
  const { Products, Shops } = collections;
  const { variant: productVariantInput, variantId, shopId } = input;

  // Check that user has permission to create product
  await context.validatePermissions(
    `reaction:legacy:products:${variantId}`,
    "update",
    { shopId }
  );

  //Update all active shops if any set. Else leave default values.
  const {activeShops} = productVariantInput;
  delete productVariantInput.activeShops;

  const updateDocument = await cleanProductVariantInput(context, {
    productVariantInput
  });

  if (activeShops && activeShops.length) {
    updateDocument.shopId = activeShops.map(shop => shop.value);
  }

  const fields = Object.keys(updateDocument);
  if (fields.length === 0) {
    throw new ReactionError("invalid-param", "At least one field to update must be provided");
  }

  updateDocument.updatedAt = new Date();

  const modifier = { $set: updateDocument };
  ProductVariant.validate(modifier, { modifier: true });

  const { value: updatedProductVariant } = await Products.findOneAndUpdate(
    {
      _id: variantId,
      shopId
    },
    modifier,
    {
      returnOriginal: false
    }
  );

  if (!updatedProductVariant) throw new ReactionError("not-found", "Product variant not found");

  const activeShopsIds = updatedProductVariant.shopId;
  updatedProductVariant.shop = shopId;
  updatedProductVariant.shopId = shopId;

  //Add active shops object for product
  updatedProductVariant.activeShops = await Shops.find({_id: {$in: activeShopsIds}}).map((doc) => {
    return {value: doc._id, label: doc.name}
  }).toArray();

  await appEvents.emit("afterVariantUpdate", {
    fields,
    productId: updatedProductVariant.ancestors[0],
    productVariant: updatedProductVariant,
    productVariantId: variantId
  });

  return updatedProductVariant;
}

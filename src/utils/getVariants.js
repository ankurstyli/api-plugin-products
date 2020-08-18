/**
 *
 * @method getVariants
 * @summary Get all of a Product's Variants or only a Product's top level Variants.
 * @param {Object} context - an object containing the per-request state
 * @param {String} productOrVariantId - A Product or top level Product Variant ID.
 * @param {Boolean} topOnly - True to return only a products top level variants.
 * @param {Object} args - an object of all arguments that were sent by the client
 * @param {Boolean} args.shouldIncludeHidden - Include hidden products in results
 * @param {Boolean} args.shouldIncludeArchived - Include archived products in results
 * @returns {Promise<Object[]>} Array of Product Variant objects.
 */
export default async function getVariants(context, node, topOnly, args) {
    const {shouldIncludeHidden, shouldIncludeArchived} = args;
    const {collections} = context;
    const {Products, Shops} = collections;
    const {_id: productOrVariantId, shopId} = node;

    const selector = {
        ancestors: topOnly ? [productOrVariantId] : productOrVariantId,
        type: "variant"
    };
    //Add shopId to show variants for specific shop product variants
    if (shopId) {
        selector.shopId = shopId;
    }

    // Only include visible variants if `false`
    // Otherwise both hidden and visible will be shown
    if (shouldIncludeHidden === false) {
        selector.isVisible = true;
    }

    // Exclude archived (deleted) variants if set to `false`
    // Otherwise include archived variants in the results
    if (shouldIncludeArchived === false) {
        selector.isDeleted = {
            $ne: true
        };
    }

    const res = await Products.find(selector).map(variant => {
        return variant;
    }).toArray();
    for (const variant of res){
        const activeShopsIds = variant.shopId;
        variant.shop = shopId;
        variant.shopId = shopId;
        variant.activeShops = await Shops.find({_id: {$in: activeShopsIds}}).map((doc) => {
            return {value: doc._id, label: doc.name}
        }).toArray();
    }
    return res;
}

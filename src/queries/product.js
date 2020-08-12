/**
 * @name product
 * @method
 * @memberof GraphQL/Product
 * @summary Query the Products collection for a single product
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Request input
 * @param {String} input.productId - Product ID
 * @param {String} input.shopId - Shop ID
 * @returns {Promise<Object>} Product object Promise
 */
export default async function product(context, input) {
    const {collections} = context;
    const {Products, Shops} = collections;
    const {productId, shopId} = input;

    await context.validatePermissions(
        `reaction:legacy:products:${productId}`,
        "read",
        {shopId}
    );

    const res = await Products.findOne({
        _id: productId,
        shopId
    });

    res.shop = shopId;
    const activeShopsIds = res.shopId;
    res.shopId = shopId;

    //Add active shops object for product
    res.activeShops = await Shops.find({_id: {$in: activeShopsIds}}).map((doc) => {
        return {value: doc._id, label: doc.name}
    }).toArray();

    return res;
}

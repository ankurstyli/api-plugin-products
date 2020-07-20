import applyProductFilters from "../utils/applyProductFilters.js";

/**
 * @name products
 * @method
 * @memberof GraphQL/Products
 * @summary Query the Products collection for a list of products
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Request input
 * @param {Boolean} [isArchived] - Filter by archived
 * @param {Boolean} [isVisible] - Filter by visibility
 * @param {String} [metafieldKey] - Filter by metafield key
 * @param {String} [metafieldValue] - Filter by metafield value
 * @param {Number} [priceMax] - Filter by price range maximum value
 * @param {Number} [priceMin] - Filter by price range minimum value
 * @param {String[]} [productIds] - List of product IDs to filter by
 * @param {String} [query] - Regex match query string
 * @param {String[]} shopIds - List of shop IDs to filter by
 * @param {String[]} [tagIds] - List of tag ids to filter by
 * @returns {Promise<Object>} Products object Promise
 */
export default async function products(context, input) {
    const {collections} = context;
    const {Products} = collections;
    const productFilters = input;

    // Check the permissions for all shops requested
    await Promise.all(productFilters.shopIds.map(async (shopId) => {
        await context.validatePermissions("reaction:legacy:products", "read", {shopId});
    }));

    // Create the mongo selector from the filters
    const selector = applyProductFilters(context, productFilters);

    // Get the first N (limit) top-level products that match the query
    return await Products.find(selector);

    // //Return only parent products. Run a loop and get only parent products.
    // const resProducts = [];

    // for (const prod of allProducts) {
    //     let parent = prod;
    //     if (prod.ancestors && prod.ancestors.length) {
    //         //Get parent product
    //         console.log('@found parent id',prod.ancestors[0] );
    //         const parentProd = await Products.find({
    //             _id: prod.ancestors[0]
    //         })
    //         parent = parentProd;
    //     }
    //     resProducts.push(parent);
    // }
    // return resProducts;

}

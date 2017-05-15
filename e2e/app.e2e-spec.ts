import { StoreFrontPageObject } from "./store-front.page-object";

describe("Store front", () => {
  let page: StoreFrontPageObject;

  beforeEach(() => {
    page = new StoreFrontPageObject();
  });

  it("should display products", async () => {
    await page.navigateTo();
    const products = await page.getProducts();
    expect(products.length).toEqual(5);
    expect(products[0].name).toEqual("Greens");
    expect(products[0].price).toEqual(3.5);
  });
});

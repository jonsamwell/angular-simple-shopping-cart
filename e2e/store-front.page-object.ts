import { browser, by, element, promise } from "protractor";
import { Product } from "./models/product.model";

export class StoreFrontPageObject {
  public navigateTo(): promise.Promise<any> {
    return browser.get("/");
  }

  public async getProducts(): promise.Promise<Product[]> {
    const defer = promise.defer<Product[]>();
    try {
      const results = await element.all(by.css(".product-container"))
                            .map<Product>(async (el) => {
                              const product = new Product();
                              product.name = await el.element(by.css(".js-product-name")).getText();
                              const priceTxt = await el.element(by.css(".js-product-price")).getText();
                              product.price = parseFloat(priceTxt.replace(/[a-z,£: ]/gi, ""));
                              return product;
                            });
      defer.fulfill(results);
    } catch (er) {
      defer.reject(er);
    }
    return defer.promise;
  }
}

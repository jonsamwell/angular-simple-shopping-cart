import { inject, TestBed } from "@angular/core/testing";
import { HttpModule, XHRBackend } from "@angular/http";
import { MockBackend } from "@angular/http/testing";
import { DeliveryOption } from "app/models/delivery-option.model";
import { Product } from "app/models/product.model";
import { ShoppingCart } from "app/models/shopping-cart.model";
import { DeliveryOptionsDataService } from "app/services/delivery-options.service";
import { ProductsDataService } from "app/services/products.service";
import "rxjs/add/observable/from";
import { Observable } from "rxjs/Observable";
import * as sinon from "sinon";
import { ShoppingCartService } from "../shopping-cart.service";
import { LocalStorageServie, StorageService } from "../storage.service";

const PRODUCT_1 = new Product();
PRODUCT_1.name = "Product 1";
PRODUCT_1.id = "1";
PRODUCT_1.price = 1;

const PRODUCT_2 = new Product();
PRODUCT_2.name = "Product 2";
PRODUCT_2.id = "2";
PRODUCT_2.price = 2;

const DELIVERY_OPT_1 = new DeliveryOption();
DELIVERY_OPT_1.name = "Delivery Option 1";
DELIVERY_OPT_1.id = "1";
DELIVERY_OPT_1.price = 1;

class MockProductDataService extends ProductsDataService {
  public all(): Observable<Product[]> {
    return Observable.from([[PRODUCT_1, PRODUCT_2]]);
  }
}

// tslint:disable-next-line:max-classes-per-file
class MockDeliveryOptionsDataService extends DeliveryOptionsDataService {
  public all(): Observable<DeliveryOption[]> {
    return Observable.from([[DELIVERY_OPT_1]]);
  }
}

describe("ShoppingCartService", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    TestBed.configureTestingModule({
      imports: [
        HttpModule
      ],
      providers: [
       { provide: ProductsDataService, useClass: MockProductDataService },
       { provide: DeliveryOptionsDataService, useClass: MockDeliveryOptionsDataService },
       { provide: StorageService, useClass: LocalStorageServie },
        ShoppingCartService
     ]
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should be injectable", inject([ShoppingCartService], (service: ShoppingCartService) => {
    expect(service).toBeTruthy();
  }));

  describe("get()", () => {
    it("should return an Observable<ShoppingCart>",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      const obs = service.get();
      expect(obs).toEqual(jasmine.any(Observable));
    }));

    it("should return a ShoppingCart model instance when the observable is subscribed to",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      const obs = service.get();
      obs.subscribe((cart) => {
        expect(cart).toEqual(jasmine.any(ShoppingCart));
        expect(cart.items.length).toEqual(0);
        expect(cart.deliveryOptionId).toBeUndefined();
        expect(cart.deliveryTotal).toEqual(0);
        expect(cart.itemsTotal).toEqual(0);
        expect(cart.grossTotal).toEqual(0);
      });
    }));

    it("should return a populated ShoppingCart model instance when the observable is subscribed to",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
         const shoppingCart = new ShoppingCart();
         shoppingCart.deliveryOptionId = "deliveryOptionId";
         shoppingCart.deliveryTotal = 1;
         shoppingCart.itemsTotal = 2;
         shoppingCart.grossTotal = 3;
         sandbox.stub(localStorage, "getItem")
                .returns(JSON.stringify(shoppingCart));

         const obs = service.get();
         obs.subscribe((cart) => {
         expect(cart).toEqual(jasmine.any(ShoppingCart));
         expect(cart.deliveryOptionId).toEqual(shoppingCart.deliveryOptionId);
         expect(cart.deliveryTotal).toEqual(shoppingCart.deliveryTotal);
         expect(cart.itemsTotal).toEqual(shoppingCart.itemsTotal);
         expect(cart.grossTotal).toEqual(shoppingCart.grossTotal);
      });
    }));
  });

  describe("empty()", () => {
    it("should create empty cart and persist",
       inject([ShoppingCartService], (service: ShoppingCartService) => {

      const stub = sandbox.stub(localStorage, "setItem");
      const obs = service.empty();

      sinon.assert.calledOnce(stub);
    }));

    it("should dispatch empty cart",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
         let dispatchCount = 0;

         const shoppingCart = new ShoppingCart();
         shoppingCart.grossTotal = 3;
         sandbox.stub(localStorage, "getItem")
                .returns(JSON.stringify(shoppingCart));

         service.get()
                .subscribe((cart) => {
                    dispatchCount += 1;

                    if (dispatchCount === 1) {
                      expect(cart.grossTotal).toEqual(shoppingCart.grossTotal);
                    }

                    if (dispatchCount === 2) {
                      expect(cart.grossTotal).toEqual(0);
                    }
                });

         service.empty();
         expect(dispatchCount).toEqual(2);
    }));
  });

  describe("addItem()", () => {
    beforeEach(() => {
      let persistedCart: string;
      const setItemStub = sandbox.stub(localStorage, "setItem")
            .callsFake((key, val) => persistedCart = val);
      sandbox.stub(localStorage, "getItem")
              .callsFake((key) => persistedCart);
    });

    it("should add the item to the cart and persist",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      service.addItem(PRODUCT_1, 1);

      service.get()
            .subscribe((cart) => {
              expect(cart.items.length).toEqual(1);
              expect(cart.items[0].productId).toEqual(PRODUCT_1.id);
            });
    }));

    it("should dispatch cart",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
         let dispatchCount = 0;

         service.get()
                .subscribe((cart) => {
                    dispatchCount += 1;

                    if (dispatchCount === 2) {
                      expect(cart.grossTotal).toEqual(PRODUCT_1.price);
                    }
                });

         service.addItem(PRODUCT_1, 1);
         expect(dispatchCount).toEqual(2);
    }));

    it("should set the correct quantity on products already added to the cart",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      service.addItem(PRODUCT_1, 1);
      service.addItem(PRODUCT_1, 3);

      service.get()
            .subscribe((cart) => {
              expect(cart.items[0].quantity).toEqual(4);
            });
    }));
  });

  describe("setDeliveryOption()", () => {
    beforeEach(() => {
      let persistedCart: string;
      const setItemStub = sandbox.stub(localStorage, "setItem")
            .callsFake((key, val) => persistedCart = val);
      sandbox.stub(localStorage, "getItem")
              .callsFake((key) => persistedCart);
    });

    it("should add the delivery option to the cart and persist",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      service.setDeliveryOption(DELIVERY_OPT_1);

      service.get()
            .subscribe((cart) => {
              expect(cart.deliveryOptionId).toEqual(DELIVERY_OPT_1.id);
            });
    }));

    it("should dispatch cart",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
         let dispatchCount = 0;

         service.get()
                .subscribe((cart) => {
                    dispatchCount += 1;

                    if (dispatchCount === 2) {
                      expect(cart.deliveryTotal).toEqual(DELIVERY_OPT_1.price);
                    }
                });

         service.setDeliveryOption(DELIVERY_OPT_1);
         expect(dispatchCount).toEqual(2);
    }));
  });

  describe("totals calculation", () => {
    beforeEach(() => {
      let persistedCart: string;
      const setItemStub = sandbox.stub(localStorage, "setItem")
            .callsFake((key, val) => persistedCart = val);
      sandbox.stub(localStorage, "getItem")
              .callsFake((key) => persistedCart);
    });

    it("should calculate the shopping cart totals correctly",
       inject([ShoppingCartService], (service: ShoppingCartService) => {
      service.addItem(PRODUCT_1, 2);
      service.addItem(PRODUCT_2, 1);
      service.addItem(PRODUCT_1, 1);
      service.setDeliveryOption(DELIVERY_OPT_1);

      service.get()
            .subscribe((cart) => {
              expect(cart.items.length).toEqual(2);
              expect(cart.deliveryTotal).toEqual(DELIVERY_OPT_1.price);
              expect(cart.itemsTotal).toEqual((PRODUCT_1.price * 3) + PRODUCT_2.price);
              expect(cart.grossTotal).toEqual((PRODUCT_1.price * 3) + PRODUCT_2.price + DELIVERY_OPT_1.price);
            });
    }));
  });
});

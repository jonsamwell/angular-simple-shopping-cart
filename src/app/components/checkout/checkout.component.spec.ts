import { async, inject, TestBed } from "@angular/core/testing";
import { HttpModule } from "@angular/http";
import { CartItem } from "app/models/cart-item.model";
import { DeliveryOption } from "app/models/delivery-option.model";
import { Product } from "app/models/product.model";
import { ShoppingCart } from "app/models/shopping-cart.model";
import { DeliveryOptionsDataService } from "app/services/delivery-options.service";
import { ProductsDataService } from "app/services/products.service";
import { ShoppingCartService } from "app/services/shopping-cart.service";
import { LocalStorageServie, StorageService } from "app/services/storage.service";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import * as sinon from "sinon";
import { CheckoutComponent } from "./checkout.component";

const PRODUCT_1 = new Product();
PRODUCT_1.name = "Product 1";
PRODUCT_1.id = "1";
PRODUCT_1.price = 1;
PRODUCT_1.description = "desc1";

const PRODUCT_2 = new Product();
PRODUCT_2.name = "Product 2";
PRODUCT_2.id = "2";
PRODUCT_2.price = 2;
PRODUCT_2.description = "desc2";

const DELIVERY_OPT_1 = new DeliveryOption();
DELIVERY_OPT_1.name = "Delivery Option 1";
DELIVERY_OPT_1.id = "1";
DELIVERY_OPT_1.price = 1;

const DELIVERY_OPT_2 = new DeliveryOption();
DELIVERY_OPT_2.name = "Delivery Option 2";
DELIVERY_OPT_2.id = "2";
DELIVERY_OPT_2.price = 2;

class MockProductDataService extends ProductsDataService {
  public all(): Observable<Product[]> {
    return Observable.from([[PRODUCT_1, PRODUCT_2]]);
  }
}

// tslint:disable-next-line:max-classes-per-file
class MockDeliveryOptionsDataService extends DeliveryOptionsDataService {
  public all(): Observable<DeliveryOption[]> {
    return Observable.from([[DELIVERY_OPT_1, DELIVERY_OPT_2]]);
  }
}

// tslint:disable-next-line:max-classes-per-file
class MockShoppingCartService {
  public unsubscriveCalled: boolean = false;
  public emptyCalled: boolean = false;

  private subscriptionObservable: Observable<ShoppingCart>;
  private subscriber: Observer<ShoppingCart>;
  private cart: ShoppingCart = new ShoppingCart();

  public constructor() {
    this.subscriptionObservable = new Observable<ShoppingCart>((observer: Observer<ShoppingCart>) => {
      this.subscriber = observer;
      observer.next(this.cart);
      return () => this.unsubscriveCalled = true;
    });
  }

  public get(): Observable<ShoppingCart> {
    return this.subscriptionObservable;
  }

  public empty(): void {
    this.emptyCalled = true;
  }

  public dispatchCart(cart: ShoppingCart): void {
    this.cart = cart;
    if (this.subscriber) {
      this.subscriber.next(cart);
    }
  }
}

describe("CheckoutComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CheckoutComponent
      ],
      imports: [
        HttpModule
      ],
      providers: [
        { provide: ProductsDataService, useClass: MockProductDataService },
        { provide: DeliveryOptionsDataService, useClass: MockDeliveryOptionsDataService },
        { provide: StorageService, useClass: LocalStorageServie },
        { provide: ShoppingCartService, useClass: MockShoppingCartService }
      ]
    }).compileComponents();
  }));

  it("should create the component", async(() => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.debugElement.componentInstance;
    expect(component).toBeTruthy();
  }));

  it("should display all the products in the cart",
    async(inject([ShoppingCartService], (service: MockShoppingCartService) => {
      const newCart = new ShoppingCart();
      const cartItem = new CartItem();
      cartItem.productId = PRODUCT_1.id;
      cartItem.quantity = 2;
      newCart.grossTotal = 3;
      newCart.items = [cartItem];
      service.dispatchCart(newCart);
      const fixture = TestBed.createComponent(CheckoutComponent);
      fixture.detectChanges();

      const component = fixture.debugElement.componentInstance;
      const compiled = fixture.debugElement.nativeElement;
      const productElements = compiled.querySelectorAll(".checkout_row");

      expect(productElements.length).toEqual(1);
      expect(productElements[0].querySelector(".js-product-name").textContent).toEqual(PRODUCT_1.name);
      expect(productElements[0].querySelector(".js-product-desc").textContent).toContain(PRODUCT_1.description);
      expect(productElements[0].querySelector(".js-product-costs").textContent)
        .toContain(`${cartItem.quantity} x £${PRODUCT_1.price}`);
      expect(productElements[0].querySelector(".js-product-total").textContent)
        .toContain(PRODUCT_1.price * cartItem.quantity);
    })));

  it("should display all the delivery options",
    async(inject([ShoppingCartService], (service: MockShoppingCartService) => {
      const fixture = TestBed.createComponent(CheckoutComponent);
      fixture.detectChanges();

      const component = fixture.debugElement.componentInstance;
      const compiled = fixture.debugElement.nativeElement;
      const deliveryOptions = compiled.querySelectorAll(".delivery-option");

      expect(deliveryOptions.length).toEqual(2);
      expect(deliveryOptions[0].querySelector(".js-option-name").textContent).toEqual(DELIVERY_OPT_1.name);
      expect(deliveryOptions[0].querySelector(".js-option-price").textContent).toContain(DELIVERY_OPT_1.price);
      expect(deliveryOptions[1].querySelector(".js-option-name").textContent).toEqual(DELIVERY_OPT_2.name);
      expect(deliveryOptions[1].querySelector(".js-option-price").textContent).toContain(DELIVERY_OPT_2.price);
    })));
});

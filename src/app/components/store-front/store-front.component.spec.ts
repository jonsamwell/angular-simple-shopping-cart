import { async, inject, TestBed } from "@angular/core/testing";
import { HttpModule } from "@angular/http";
import { CartItem } from "app/models/cart-item.model";
import { Product } from "app/models/product.model";
import { ShoppingCart } from "app/models/shopping-cart.model";
import { DeliveryOptionsDataService } from "app/services/delivery-options.service";
import { ProductsDataService } from "app/services/products.service";
import { ShoppingCartService } from "app/services/shopping-cart.service";
import { LocalStorageServie, StorageService } from "app/services/storage.service";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import * as sinon from "sinon";
import { ShoppingCartComponent } from "../shopping-cart/shopping-cart.component";
import { StoreFrontComponent } from "./store-front.component";

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

// tslint:disable-next-line:max-classes-per-file
class MockProductDataService extends ProductsDataService {
  public all(): Observable<Product[]> {
    return Observable.from([[PRODUCT_1, PRODUCT_2]]);
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

  public addItem(product: Product, quantity: number): void {}

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

describe("StoreFrontComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ShoppingCartComponent,
        StoreFrontComponent
      ],
      imports: [
        HttpModule
      ],
      providers: [
       { provide: ProductsDataService, useClass: MockProductDataService },
       { provide: DeliveryOptionsDataService, useValue: sinon.createStubInstance(DeliveryOptionsDataService) },
       { provide: StorageService, useClass: LocalStorageServie },
       { provide: ShoppingCartService, useClass: MockShoppingCartService }
     ]
    }).compileComponents();
  }));

  it("should create the component", async(() => {
    const fixture = TestBed.createComponent(StoreFrontComponent);
    const component = fixture.debugElement.componentInstance;
    expect(component).toBeTruthy();
  }));

  it("should display all the products", async(() => {
    const fixture = TestBed.createComponent(StoreFrontComponent);
    fixture.detectChanges();

    const component = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;
    const productElements = compiled.querySelectorAll(".product-container");
    expect(productElements.length).toEqual(2);

    expect(productElements[0].querySelector(".js-product-name").textContent).toEqual(PRODUCT_1.name);
    expect(productElements[0].querySelector(".js-product-price").textContent).toContain(PRODUCT_1.price);
    expect(productElements[0].querySelector(".js-product-desc").textContent).toContain(PRODUCT_1.description);

    expect(productElements[1].querySelector(".js-product-name").textContent).toEqual(PRODUCT_2.name);
    expect(productElements[1].querySelector(".js-product-price").textContent).toContain(PRODUCT_2.price);
    expect(productElements[1].querySelector(".js-product-desc").textContent).toContain(PRODUCT_2.description);
  }));

  it("should not display the remove item button when the item is not in the cart", async(() => {
    const fixture = TestBed.createComponent(StoreFrontComponent);
    fixture.detectChanges();

    const component = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;
    const productElements = compiled.querySelectorAll(".product-container");
    expect(productElements.length).toEqual(2);

    expect(productElements[0].querySelector(".js-product-name").textContent).toEqual(PRODUCT_1.name);
    expect(productElements[0].querySelector(".js-product-price").textContent).toContain(PRODUCT_1.price);
    expect(productElements[0].querySelector(".js-product-desc").textContent).toContain(PRODUCT_1.description);
    expect(productElements[0].querySelectorAll(".js-btn-remove").length).toEqual(0);
  }));

  it("should add the product to the cart when add item button is clicked",
     async(inject([ShoppingCartService], (service: MockShoppingCartService) => {
    const fixture = TestBed.createComponent(StoreFrontComponent);
    fixture.detectChanges();

    const addItemSpy = sinon.spy(service, "addItem");

    const component = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;
    const productElements = compiled.querySelectorAll(".product-container");

    productElements[0].querySelector(".js-btn-add").click();
    sinon.assert.calledOnce(addItemSpy);
    sinon.assert.calledWithExactly(addItemSpy, PRODUCT_1, 1);
  })));

  it("should remove the product from the cart when remove item button is clicked",
     async(inject([ShoppingCartService], (service: MockShoppingCartService) => {
    const newCart = new ShoppingCart();
    const cartItem = new CartItem();
    cartItem.productId = PRODUCT_1.id;
    cartItem.quantity = 1;
    newCart.grossTotal = 1.5;
    newCart.items = [cartItem];
    service.dispatchCart(newCart);
    const fixture = TestBed.createComponent(StoreFrontComponent);
    fixture.detectChanges();

    const addItemSpy = sinon.spy(service, "addItem");

    const component = fixture.debugElement.componentInstance;
    const compiled = fixture.debugElement.nativeElement;
    const productElements = compiled.querySelectorAll(".product-container");

    productElements[0].querySelector(".js-btn-remove").click();
    sinon.assert.calledOnce(addItemSpy);
    sinon.assert.calledWithExactly(addItemSpy, PRODUCT_1, -1);
  })));
});

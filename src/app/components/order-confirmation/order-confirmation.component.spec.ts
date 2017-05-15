import { async, inject, TestBed } from "@angular/core/testing";
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
import { OrderConfirmationComponent } from "./order-confirmation.component";

class MockShoppingCartService {
  public emptyCalled: boolean = false;

  public empty(): void {
    this.emptyCalled = true;
  }
}

describe("OrderConfirmationComponent", () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        OrderConfirmationComponent
      ],
      providers: [
       { provide: ProductsDataService, useValue: sinon.createStubInstance(ProductsDataService) },
       { provide: DeliveryOptionsDataService, useValue: sinon.createStubInstance(DeliveryOptionsDataService) },
       { provide: StorageService, useClass: LocalStorageServie },
       { provide: ShoppingCartService, useClass: MockShoppingCartService }
     ]
    }).compileComponents();
  }));

  it("should create the component", async(() => {
    const fixture = TestBed.createComponent(OrderConfirmationComponent);
    const component = fixture.debugElement.componentInstance;
    expect(component).toBeTruthy();
  }));

  it("should call empty on shopping cart service when initialised",
     async(inject([ShoppingCartService], (service: MockShoppingCartService) => {
    const fixture = TestBed.createComponent(OrderConfirmationComponent);
    fixture.detectChanges();
    expect(service.emptyCalled).toBeTruthy();
  })));
});

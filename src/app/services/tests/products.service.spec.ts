import { inject, TestBed } from "@angular/core/testing";
import { HttpModule, Response, ResponseOptions, XHRBackend } from "@angular/http";
import { MockBackend } from "@angular/http/testing";
import { Ingredient } from "app/models/ingredient.model";
import { Product } from "app/models/product.model";
import { ProductsDataService } from "app/services/products.service";

describe("ProductsService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpModule
      ],
      providers: [
        ProductsDataService,
       { provide: XHRBackend, useClass: MockBackend }
     ]
    });
  });

  it("should be injectable", inject([ProductsDataService], (service: ProductsDataService) => {
    expect(service).toBeTruthy();
  }));

  describe("all()", () => {
    it("should call the correct http endpoint",
       inject([ProductsDataService, XHRBackend],
       (service: ProductsDataService, mockBackend: MockBackend) => {

      mockBackend.connections.subscribe((connection) => {
        expect(connection.request.url).toEqual("./assets/products.json");
        connection.mockRespond(new Response(new ResponseOptions({
          body: JSON.stringify(createProducts(2))
        })));
      });

      service.all()
             .subscribe((products) => {
                expect(products.length).toBe(2);
                expect(products[0].id).toBe("0");
                expect(products[1].id).toBe("1");
             });
    }));
  });
});

function createProducts(count: number): Product[] {
  const products = new Array<Product>();
  for (let i = 0; i < count; i += 1) {
    const product = new Product();
    product.id = i.toString();
    product.name = `name ${i}`;
    product.description = `description ${i}`;
    product.price = i;
    product.ingredients = new Array<Ingredient>();
    products.push(product);
  }

  return products;
}

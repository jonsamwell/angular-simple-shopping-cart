import { inject, TestBed } from "@angular/core/testing";
import { HttpModule, Response, ResponseOptions, XHRBackend } from "@angular/http";
import { MockBackend } from "@angular/http/testing";
import { MockConnection } from "@angular/http/testing";
import { DeliveryOption } from "app/models/delivery-option.model";
import { DeliveryOptionsDataService } from "app/services/delivery-options.service";

describe("DeliveryOptionsDataService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpModule
      ],
      providers: [
        DeliveryOptionsDataService,
       { provide: XHRBackend, useClass: MockBackend }
     ]
    });
  });

  it("should be injectable", inject([DeliveryOptionsDataService], (service: DeliveryOptionsDataService) => {
    expect(service).toBeTruthy();
  }));

  describe("all()", () => {
    it("should call the correct http endpoint",
       inject([DeliveryOptionsDataService, XHRBackend],
       (service: DeliveryOptionsDataService, mockBackend: MockBackend) => {

      mockBackend.connections.subscribe((connection: MockConnection) => {
        expect(connection.request.url).toEqual("./assets/delivery-options.json");
        connection.mockRespond(new Response(new ResponseOptions({
          body: JSON.stringify(createDeliveryOptions(2))
        })));
      });

      service.all()
             .subscribe((options) => {
                expect(options.length).toBe(2);
                expect(options[0].id).toBe("0");
                expect(options[1].id).toBe("1");
             });
  }));

  });
});

function createDeliveryOptions(count: number): DeliveryOption[] {
  const options = new Array<DeliveryOption>();
  for (let i = 0; i < count; i += 1) {
    const option = new DeliveryOption();
    option.id = i.toString();
    option.name = `name ${i}`;
    option.description = `description ${i}`;
    option.price = i;
    options.push(option);
  }

  return options;
}

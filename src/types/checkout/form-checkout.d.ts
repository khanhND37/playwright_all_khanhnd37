import { Card, ShippingAddress } from "@types";

export type FormCheckoutData = {
  form_shipping: ShippingAddress;
  form_payment?: Card;
};

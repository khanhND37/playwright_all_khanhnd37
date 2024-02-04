### Đây là toàn bộ setting của store, Yêu cầu setting giống hệt data trong đây

# Product

- Bikini: 40$
- Bikini 2: 30$
- Bikini 3: 20$
- Bikini 4: 10$
- Post purchase: 50$

# Tax

- Tax: AUTO_TAX_US
- Tax zone: United States
- Tax rate: 10%

# Tipping

- Percentage: [5,10,20]

# Shipping

- Shipping Zone: United States
  - Price base rate: Standard Shipping
  - Price: 5.99$

# Automatic discount

- Automatic_discount_freeship
  - Automatic discount
  - Discount free shipping
  - Apply for specific country: United States

- Automatic_discount_20percent
  - Automatic discount
  - Discount percentage
  - Discount 20%
  - Apply for specific collection: Auto Collection
  - Apply for quantity: greater than 2

- Automatic_discount_20percent_specific
  - Automatic discount
  - Discount percentage
  - Discount 20%
  - Apply for specific collection: Auto Collection
  - Apply for quantity: greater than 2
  Discount Automatic_discount_20percent_specific không combine với product discount
  Discount Automatic_discount_20percent_specific không combine với shipping discount
  Discount Automatic_discount_20percent_specific không combine với upsell discount

- Automatic_discount_freeship_specific
  - Automatic discount
  - Discount free shipping
  - Apply for specific country: United States  
  Discount Automatic_discount_freeship_specific không combine với shipping discount
  Discount Automatic_discount_freeship_specific không combine với upsell discount

# Discount manual

- Manual_discount_20percent
  - Manual discount
  - Discount 20%
  - Apply for specific: Bikini
  - Apply for subtotal: greater than 30

- Manual_free_shipping_us
  - Manual discount
  - Discount free shipping
  - Apply for specific country: United States

- Manual_discount_fixamt_5$
  - Manual discount
  - Discount 5$
  - Apply for specific: Bikini, Post purchase
  - Apply for subtotal: greater than 30

- Manual_discount_10percent
  - Manual discount
  - Discount 10%
  - Apply for specific: Bikini, Post purchase
  - Apply for subtotal: greater than 20

- Manual_discount_fixamt_10$
  - Manual discount
  - Discount 10$
  - Apply for specific: Bikini, Post purchase
  - Apply for subtotal: greater than 30

- Manual_discount_buyxgety_50%
  - Manual discount
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Apply for specific customer: testerOCG@mailtothis.com

- Manual_discount_buyxgety_50%_2
  - Manual discount
  - Buy 2 product: Bikini
  - Get 1 product: Bikini
  - Discount 50%
  - Apply for specific customer: testerOCG@mailtothis.com

- Manual_discount_20percent_specific
  - Manual discount
  - Discount 20%
  Discount Manual_discount_20percent_specific không combine với product discount
  Discount Manual_discount_20percent_specific không combine với shipping discount
  Discount Manual_discount_20percent_specific không combine với upsell discount

- Manual_free_shipping_us_specific
  - Manual discount
  - Discount free shipping
  - Apply for specific country: United States
  Discount Manual_free_shipping_us_specific không combine với product discount
  

## Boost upsell

- Auto upsell offer pre-purchase
  - Offer pre-purchase
  - Recommned product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount 10 percent

- Auto upsell offer post-purchase
  - Offer post-purchase
  - Recommned product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount 10 percent

- Auto upsell offer in cart
  - Offer in-cart
  - Recommned product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount 10 percent

- Auto upsell offer bundle
  - Offer bundle
  - Recommned product: Bikini, Bikini 4
  - Discount 10 percent

- Auto upsell offer quantity discount
  - Offer quantity discount
  - Min quantity: 1 - Value discount 5$ sale off each product
  - Min quantity: 2 - Value discount 5$ sale off each product

- Auto upsell offer quantity discount 2
  - Offer quantity discount
  - Min quantity: 1 - Value discount 5$ sale off each product
  - Min quantity: 2 - Value discount 6$ sale off each product
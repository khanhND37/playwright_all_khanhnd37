### Đây là toàn bộ setting của store, Yêu cầu setting giống hệt data trong đây

# Product

Dropship product: 
- (Test product) Auto-Cpay1: 40$
- (Test product) Auto-Cpay2: 40$

POD product: : 
- Bikini: 50%
- Bikini 2: 30$

# Tax

- Tax: AUTO_TAX_US
- Tax zone: United States
- Tax rate: 10%

# Tipping

- Percentage: [5,10,20]

# Shipping

- Shipping Zone: United States
  - Price base rate: Standard Shipping
  - First Price: 5.99$
  - Additional Item price: ?

  - Price base rate: Fast Shipping
  - Price: 6.99$

  - Price base rate: Premium Shipping
  - Price: 9.99$

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
  - Apply for specific: Bikini, (Test product) Auto-Cpay1
  - Apply for subtotal: greater than 30

- Manual_discount_10percent
  - Manual discount
  - Discount 10%
  - Apply for specific: Bikini, (Test product) Auto-Cpay1
  - Apply for subtotal: greater than 20

- Manual_discount_fixamt_10$
  - Manual discount
  - Discount 10$
  - Apply for specific: Bikini, (Test product) Auto-Cpay1
  - Apply for subtotal: greater than 30

- Manual_discount_buyxgety_50%
  - Manual discount
  - Buy 2 product: Bikini
  - Get 1 product: (Test product) Auto-Cpay1
  - Discount 50%
  - Apply for specific customer: testerOCG@mailtothis.com


## Boost upsell

- Auto upsell offer pre-purchase
  - Offer pre-purchase
  - Recommned product: Bikini 2
  - Discount 10 percent

- Auto upsell offer post-purchase
  - Offer (Test product) Auto-Cpay1
  - Recommned product: (Test product) Auto-Cpay2
  - Discount 10 percent
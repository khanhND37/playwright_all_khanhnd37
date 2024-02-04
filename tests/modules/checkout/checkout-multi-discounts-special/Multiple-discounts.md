# Product

- Bikini: 40$
- Bikini 2: 30$
- Post purchase: 50$
- Bikini 3: 20$
- Bikini 4: 10$

# Tax

- Tax: AUTO_TAX_US
- Tax zone: United States
- Tax rate: 10%

# Tipping

- Percentage: [5,10,20]

# Shipping

- Auto_Shipping Zone: United States
  - Price base rate: Standard Shipping
  - Price: 5.99$

# MANUAL DISCOUNT

-------- Percentage --------
- Auto_Percent_1
  - Manual discount
  - Discount 20%

- Auto_Percent_2
  - Manual discount
  - Discount 20%
  - Apply for specific: Post purchase

- Auto_Percent_3
  - Manual discount
  - Discount 10%
  - Minimum quantity of items: 3

- Auto_Percent_4
  - Manual discount
  - Discount 10%
  - Apply for subtotal: greater than 90

- Auto_Percent_5
  - Manual discount
  - Discount 10%
  - Specific customer: testerOCG@mailtothis.com

- Opay_Discount_Percent
  - Manual discount
  - Discount: 20
  - Usage limit: 2
  - Apply for product: Bikini
  - Apply for quantity range: greater or equal 2

- SB_30_Discount_Percent_2
  - Manual discount
  - Discount 10%
  - Usage limit: 2
  - Apply for product: Bikini
  - Apply for quantity range: greater or equal 2

  
-------- Free shipping --------
- Auto_Free_shipping_1
  - Manual discount
  - Discount free shipping

- Auto_Free_shipping_2
  - Manual discount
  - Discount free shipping

- Auto_Free_shipping_3
  - Manual discount
  - Discount free shipping

-------- Fix amount --------
- Auto_Fixamt_1
  - Manual discount
  - Discount: 20$

- Auto_Fixamt_2
  - Manual discount
  - Discount: 20$

- Auto_Fixamt_3
  - Manual discount
  - Discount: 20$
  - Minimum quantity of items: 3

- Auto_Fixamt_4
  - Manual discount
  - Discount: 20$
  - Minimum purchase amount: 90

- Auto_Fixamt_5
  - Manual discount
  - Discount: 20$
  - Specific customer: buyer@onshopbase.com

- Opay_Discount_Fixamt
  - Manual discount
  - Usage limit: 2
  - Apply for subtotal: greater than 30
  - Discount: 5

- Opay_Discount_Fixamt_1
  - Manual discount
  - Usage limit: 2
  - Apply for subtotal: greater than 30
  - Discount: 10

- SB_37_Discount_Fixamt
  - Manual discount
  - Discount: 6
  - Usage limit: 2
  - Apply for collection have 2 products: Post purchase + Bikini
  - Once per customer: false
  - Apply for subtotal: greater than or equal 30

- SB_37_Discount_Fixamt_1
  - Manual discount
  - Discount: 6
  - Usage limit: 2
  - Apply for collection have 2 products: Post purchase + Bikini
  - Once per customer: false
  - Apply for subtotal: greater than or equal 30

- SB_36_Discount_Fixamt
  - Manual discount
  - Discount: 6
  - Usage limit: 2
  - Apply for specific product: Post purchase + Bikini
  - Once per customer: false
  - Apply for subtotal: greater than or equal 30

- SB_36_Discount_Fixamt_1
  - Manual discount
  - Discount: 6
  - Usage limit: 2
  - Apply for specific product: Post purchase + Bikini
  - Once per customer: false
  - Apply for subtotal: greater than or equal 30

- SB_35_Discount_Fixamt
  - Manual discount
  - Discount: 60
  - Apply for specific product: Post purchase
  - Apply for subtotal: greater than or equal 30

- SB_29_Discount_Fixamt
  - Manual discount
  - Discount: 50
  - Apply for subtotal: greater than or equal 30

-------- Buy X get Y --------
- Auto_buyxgety_1
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%

- Auto_buyxgety_2
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Apply for specific customer: testerOCG@mailtothis.com

- Auto_buyxgety_3
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limits: 1

- SB_34_capture_buy_x_get_y_2
  - Manual discount  
  - Buy 2 product: Bikini 2
  - Get 2 product: Post purchase
  - Discount percentage 100
  - Usage limits: 2
  - Apply for specific customer: testerOCG@mailtothis.com

- SB_33_capture_buy_x_get_y_2
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limit: 2
  - Apply for specific customer: testerOCG@mailtothis.com

- SB_31_32_capture_buy_x_get_y
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limits: 2
  - Apply for specific customer: testerOCG@mailtothis.com

- SB_32_capture_buy_x_get_y_2
  - Manual discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 100%
  - Usage limits: 2
  - Apply for specific customer: testerOCG@mailtothis.com

- SB_31_capture_buy_x_get_y_2
  - Manual discount  
  - Buy 2 product: Bikini 2
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limits: 2
  - Apply for specific customer: testerOCG@mailtothis.com

-------- Shareable Link --------
- Opay_auto_shareable_link
  - Manual discount
  - Link: au-domain/?discount=Opay_auto_shareable_link
  - Discount pencentage 20%
  - Usage limit: 2
  - Apply for specific product: Bikini
  - Apply for quantity range: greater or equal 2
  
# AUTO DISCOUNT 

-------- Boost upsell --------
- Auto upsell offer pre-purchase
  - Offer type: Pre-purchase
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount Percentage: 10%

- Auto upsell offer post-purchase
  - Offer type: Post-purchase
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount Percentage: 10%

- Auto upsell offer in cart
  - Offer type: In-cart
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount Percentage: 10%

- Auto upsell offer bundle
  - Offer type: Bundle
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount Percentage: 10%

- Auto upsell offer quantity discount
  - Offer type: Quantity
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount ??

- Auto upsell offer quantity discount 2
  - Offer type: Quantity
  - Recommend product: Bikini, post purchase, Bikini 2, Bikini 3, Bikini 4, Bikini 5
  - Discount ??

-------- Discount --------
- Opay_Discount_Percent_Auto
  - Automatic discount
  - Type: Percentage
  - Discount: 20%
  - Usage limit: 2
  - Collection: Bikini, Bikini 2, Bikini 3, Bikini 4
  - Apply for quantity range: greater or equal 2

- Opay_Discount_buyxgety
  - Automatic discount  
  - Buy 2 product: Bikini
  - Get 1 product: Post purchase
  - Discount Percentage 50%
  - Usage limits: 2
  - Apply for specific customer: testerOCG@mailtothis.com

- Opay_auto_free shipping
  - Automatic discount

- SB_34_35_capture_buy_x_get_y
  - Automatic discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limit: 2

- SB_33_capture_buy_x_get_y
  - Automatic discount  
  - Buy 2 product: Bikini
  - Get 2 product: Post purchase
  - Discount 50%
  - Usage limit: 2

- SB_30_Discount_Percent_Auto
  - Automatic discount
  - Type: Percentage
  - Discount: 20%
  - Usage limit: 2
  - Collection: Bikini, Bikini 2, Bikini 3, Bikini 4
  - Apply for quantity range: greater or equal 2


# SB_DC_MD_SB_28
- SB_28_Discount_Percent
  - Manual discount
  - Type: Percentage
  - Discount: 20
  - Apply for specific product: Bikini
  - Apply for quantity range: greater or equal 2
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_28_Discount_Percent_1
  - Manual discount
  - Type: Percentage
  - Discount: 20
  - Apply for specific collection: 
  - Apply for quantity range: greater or equal 2
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_28_Discount_Fixamt
  - Manual discount
  - Type: Fix amount
  - Discount: 5
  - Apply for specific product: Bikini, Post purchase 
  - Apply for subtotal: greater or equal 30
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_28_Free_shipping
  - Manual discount
  - Discount free shipping

# SB_DC_MD_SB_27
- SB_27_Discount_Percent
  - Automatic discount
  - Type: Percentage
  - Discount: 20
  - Apply for specific product: Bikini
  - Apply for quantity range: greater or equal 2
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_27_Discount_Percent_1
  - Manual discount
  - Type: Percentage
  - Discount: 20
  - Apply for specific collection: 
  - Apply for quantity range: greater or equal 2
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_27_Discount_Fixamt
  - Manual discount
  - Type: Fix amount
  - Discount: 5
  - Apply for specific product: Bikini, Post purchase 
  - Apply for subtotal: greater or equal 30
  - Khong combine voi product discount
  - Combine voi shipping discount

- SB_27_Free_shipping
  - Manual discount
  - Discount free shipping
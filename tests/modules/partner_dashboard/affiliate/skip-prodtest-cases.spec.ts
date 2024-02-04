import { test } from "@core/fixtures";

test.describe("Verify chức năng đăng kí ref thành công của promoter - các case skip trên prodtest", async () => {
  test(`@SB_PN_PNAF_15 [Shopbase] Verify luồng tính commision`, async () => {
    await test.step(`Thực hiện confirm plan ở shop của ref:1. Vào màn select plan qua link  2. Chọn 1 gói và thực hiện thanh toán  `, async () => {
      // fill your code here
    });

    await test.step(`Mở storefront của shop > thực hiện checkout  order với sản phẩm "Unisex tshirt" với số lượng = 5`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_16 [Shopbase] Verify luồng hold commission khi user vi phạm product và bỏ vi phạm ở cycle hiện tại`, async () => {
    await test.step(`Thực hiện checkout  order với sản phẩm "Unisex tshirt" với số lượng = 5`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive đánh dấu vi phạm product "Unisex Tshirt"`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log đã được update hold status field thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, refund 1 phần`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log tạo record mới của refund thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, cancel order`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log tạo record mới của refund thông qua API`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_17 [Shopbase] Verify luồng hold commission khi user vi phạm shop (store front) ở cycle hiện tại`, async () => {
    await test.step(`Mở SF của shop thuộc ref > thực hiện checkout  order với sản phẩm "Unisex tshirt" với số lượng = 5`, async () => {
      // fill your code here
    });

    await test.step(`Trong dashboard, thực hiện confirm plan:   1. Vào màn select plan qua link  2. Chọn 1 gói và thực hiện thanh toán  `, async () => {
      // fill your code here
    });

    await test.step(`Vào hive đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : No  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, refund 1 phần order đã checkout ở step 1`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, cancel order đã check out ở step 1`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : Yes  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra update hold status của tất cả các record commisson có shop_id là id của shop trên trong bảng "affiliate commission log" thông qua API `, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra update hold status của tất cả các record commisson có shop_id là id của shop trên trong bảng "affiliate commission log" thông qua API `, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_18 [Shopbase] Verify luồng hold commission khi user vi phạm shop (Dashboard) và bỏ vi phạm ở cycle hiện tại`, async () => {
    await test.step(`Mở SF của shop thuộc ref > thực hiện checkout  order với sản phẩm "Unisex tshirt" với số lượng = 5`, async () => {
      // fill your code here
    });

    await test.step(`Trong dashboard, thực hiện confirm plan:   1. Vào màn select plan qua link  2. Chọn 1 gói và thực hiện thanh toán  `, async () => {
      // fill your code here
    });

    await test.step(`Vào hive, đanh dấu vi phạm dashboard shop: -  Trong hive, đi đến màn edit shop.   > Uncheck Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, refund 1 phần order đã checkout ở step 1`, async () => {
      // fill your code here
    });

    await test.step(`Vào dashboard của shop, cancel order đã check out ở step 1`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm dashboard shop:-  Trong hive, đi đến màn edit shop.   > Check Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra update hold status của tất cả các record commisson có shop_id là id của shop trên trong bảng "affiliate commission log" thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra có dữ liệu của affiliate commission log thông qua API`, async () => {
      // fill your code here
    });

    await test.step(`Kiểm tra update hold status của tất cả các record commisson có shop_id là id của shop trên trong bảng "affiliate commission log" thông qua API`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_32 [Printbase] Verify luồng hold commission khi user vi phạm product và bỏ vi phạm ở cycle hiện tại`, async () => {
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm SilverBase, GoldBase.`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive đánh dấu vi phạm 2 product "Vào hive đánh dấu vi phạm product "GoldBase", "SilverBase"`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm 2 product "Vào hive đánh dấu vi phạm product "GoldBase", "SilverBase"  `, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive pbase > filter order 1 đã checkout ở step 1 >  Click btn Approve > click btn Refund > thực hiện refund 1 phần order.  `, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive > filter order 1.> Click cancel > thực hiện cancel order  .`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_33 [Printbase] Verify luồng hold commission khi user vi phạm shop (storefront) và bỏ vi phạm shop ở cycle hiện tại`, async () => {
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm SilverBase, GoldBase.`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : No  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : Yes  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive pbase > filter order 1 > Click btn Approve > click btn Refund > thực hiện refund 1 phần order.  `, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive pbase > filter order 1.> Click cancel > thực hiện cancel order  `, async () => {
      // fill your code here
    });

    await test.step(``, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_34 [Printbase] Verify luồng hold commission khi user vi phạm shop (dashboard) và bỏ vi phạm shopở cycle hiện tại`, async () => {
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm SilverBase, GoldBase.`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive, đánh dấu vi phạm dashboard shop: -  Trong hive, đi đến màn edit shop.   > Uncheck Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive pbase > filter order 1 > Click btn Approve > click btn Refund > thực hiện refund 1 phần order.  `, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Đi đến trang hive pbase > filter order 1.> Click cancel > thực hiện cancel order`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm dashboard shop:-  Trong hive, đi đến màn edit shop.   > Check Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_66 [Plusbase] Verify luồng hold commission khi user vi phạm shop (storefront) và bỏ vi phạm ở cycle hiện tại`, async () => {
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm đã chuẩn bị ở pre-condition`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : No  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Đăng nhập shop template > mở order detail của order 1 đã checkout ở step 1 > Approve order > Click button "Refund order" > thực hiện refund 1 phần order`, async () => {
      // fill your code here
    });

    await test.step(`Đăng nhập shop template > mở order detail của order 1 đã checkout ở step 1 > click button "More actions" > chọn "Cancel order" > chọn "Cancel/refund combo line items" > nhập thông tin refund > click "Cancel  `, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm storefront shop:-  Trong hive, đi đến màn edit shop.- Click Action > Update online store enable > update- Store enable : Yes  - Reason: violation> click button Update.`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });
  });

  test(`@SB_PN_PNAF_67 [Plusbase] Verify luồng hold commission khi user vi phạm shop (dashboard) và bỏ vi phạm ở cycle hiện tại`, async () => {
    await test.step(`Mở Storefront của shop thuộc user B > checkout 2 order với các sản phầm đã chuẩn bị ở pre-condition`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary  - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Vào hive, đánh dấu vi phạm dashboard shop: -  Trong hive, đi đến màn edit shop.   > Uncheck Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Đăng nhập shop template > mở order detail của order 1 đã checkout ở step 1 > Approve order > Click button "Refund order" > thực hiện refund 1 phần order`, async () => {
      // fill your code here
    });

    await test.step(`Đăng nhập shop template > mở order detail của order 1 đã checkout ở step 1 > click button "More actions" > chọn "Cancel order" > chọn "Cancel/refund combo line items" > nhập thông tin refund > click "Cancel  `, async () => {
      // fill your code here
    });

    await test.step(`Vào hive bỏ đánh dấu vi phạm dashboard shop:-  Trong hive, đi đến màn edit shop.   > Check Enable > click button Update`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });

    await test.step(`Ở tab đang đăng nhập partner dashboard, kiểm tra số liệu commisson của promoter A:  - Kiểm tra số liệu Summary - Tìm user email của ref B > kiểm tra số liệu quantity của ref đó`, async () => {
      // fill your code here
    });
  });
});

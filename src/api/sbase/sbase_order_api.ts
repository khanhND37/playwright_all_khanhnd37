import { SbaseAdminApi } from "@pages/api/sbase_admin";
import type { FixtureApiResponse, SbOrders, SearchSbOrder, TestApiCase } from "@types";
import { formatDate } from "@utils/datetime";

export class SBaseOrderApi extends SbaseAdminApi {
  async searchOrders(data?: SearchSbOrder): Promise<FixtureApiResponse<SbOrders>> {
    if (data.x_test_created_at_min_time)
      data.created_at_min = formatDate(data.x_test_created_at_min_time, "YYYY-MM-DD");
    if (data.x_test_created_at_max_time)
      data.created_at_max = formatDate(data.x_test_created_at_max_time, "YYYY-MM-DD");

    return await super.requestByShopToken({
      url: "/admin/orders/v2.json",
      method: "GET",
      request: {
        params: data,
      },
    } as TestApiCase);
  }
}

import Odoo from "odoo-xmlrpc";
import { test as base } from "@core/fixtures";
import type { FixtureOdoo } from "@types";

let uid = 0;
let client: Odoo;

export const test = base.extend<{
  odoo: FixtureOdoo;
}>({
  odoo: [
    async ({ conf }, use) => {
      const odoo: FixtureOdoo = {
        connect() {
          client = new Odoo({
            url: conf.suiteConf.odoo_host || process.env.ODOO_HOST,
            db: conf.suiteConf.odoo_db || process.env.ODOO_DB,
            username: conf.suiteConf.odoo_username || process.env.ODOO_USERNAME,
            password: conf.suiteConf.odoo_password || process.env.ODOO_PASSWORD,
          });

          return new Promise((resolve, reject) => {
            client.connect((err, value) => {
              if (err) {
                return reject(err);
              }

              uid = value;
              return resolve(client);
            });
          });
        },
        async request(model, method, args) {
          if (!uid || !client) {
            client = await this.connect();
          }

          return new Promise((resolve, reject) => {
            client.execute_kw(model, method, args, (err, value) => {
              if (err) {
                return reject(err);
              }

              return resolve(value);
            });
          });
        },
        async searchRead({ model, args, fields = null, offset = 0, limit = null, order = null }) {
          const params = [[args, fields, offset, limit, order]];
          return await this.request(model, "search_read", params);
        },
        async search({ model, args, offset = 0, limit = null, order = null }) {
          const params = [[args, offset, limit, order]];
          return await this.request(model, "search", params);
        },
        async read(model, ids, fields: null) {
          const params = [[ids, fields]];
          return await this.request(model, "read", params);
        },
        count(model, args) {
          const params = [[args]];
          return this.request(model, "search_count", params);
        },
        async create(model, args) {
          const params = [[args]];
          return await this.request(model, "create", params);
        },
        async update(model, id, argsUpdate) {
          const params = [id, argsUpdate];
          return await this.request(model, "write", [params]);
        },
        async updateMulti(model, ids, argsUpdate) {
          const params = [ids, argsUpdate];
          return await this.request(model, "write", [params]);
        },
        async delete(model, ids) {
          const params = [ids];
          return await this.request(model, "unlink", params);
        },
        async actionQuickDone({ model, args }) {
          const params = [[args]];
          return await this.request(model, "action_quick_done", params);
        },
        async actionCheckAvailability({ model, args }) {
          const params = [[args]];
          return await this.request(model, "action_assign_and_assign_owner", params);
        },
        async callAction({ model, args, action }) {
          const params = [args];
          return await this.request(model, action, params);
        },
        async callActionV2({ model, args, action }) {
          const params = [args];
          return await this.request(model, action, params);
        },
      };
      await use(odoo);
    },
    { scope: "test" },
  ],
});

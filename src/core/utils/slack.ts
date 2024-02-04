export type SlackUser = {
  id: string;
  name: string;
  real_name: string;
  profile: {
    display_name: string;
    display_name_normalized: string;
  };
};

export class SlackHelper {
  private readonly url;
  private readonly token;

  constructor() {
    if (!process.env.SLACK_API_URL) {
      throw new Error("Missing Slack API URL");
    }
    this.url = process.env.SLACK_API_URL;

    if (!process.env.SLACK_TOKEN) {
      throw new Error("Missing Slack token");
    }
    this.token = process.env.SLACK_TOKEN;
  }

  async getUserByEmail(email: string): Promise<SlackUser> {
    const raw = await fetch(`${this.url}/users.lookupByEmail?email=${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    const result = await raw.json();
    if (result.ok) {
      return result.user;
    }

    return null;
  }
}

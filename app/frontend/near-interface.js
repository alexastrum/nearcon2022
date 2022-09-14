export class Contract {
  wallet;

  constructor({ wallet }) {
    this.wallet = wallet;
  }

  async getGreeting() {
    const o = await this.wallet.viewMethod({ method: 'get_skills', args: { addr: "new_member6578.testnet" } });
    return JSON.stringify(o);
  }

  async setGreeting(greeting) {
    return await this.wallet.callMethod({ method: 'set_greeting', args: { message: greeting } });
  }
}
const Proxy = artifacts.require('Proxy');
const Controller = artifacts.require('LILM');
//const Controller2 = artifacts.require('./Controller2.sol');

//Use Chai.should for assertion
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();
chai.use(chaiAsPromised);

const name = "Locked ILM token";
const symbol = "LILM";
const decimals = 18;
const initCap = 400000000;

const name2 = "COIN2";
const symbol2 = "COIN2";
const decimals2 = 16;
const initCap2 = 500000000;

contract('LILM', (accounts) => {
    let proxy;
    let token;
    let controller;

    beforeEach(async () => {
        proxy = await Proxy.new();
        controller = await Controller.new();
        token = Controller.at(proxy.address);
    });

    describe('LILM - ILM core token tests', function () {
      it('should be initializable through proxy', async () => {
        // initialize contract
        await token.initialize(controller.address, initCap);

        // check total supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 0);
        // check cap
        let cap = await token.cap();
        assert.equal(cap.toNumber(), initCap);
        // check wiring to proxy
        let del = await proxy.delegation();
        assert.equal(del, controller.address);
        // check wiring to proxy
        let addr = await token.thisAddr();
        assert.equal(addr, controller.address);
      });

      it('should not be initializable without proxy', async () => {
        // try to call initialize() without delegatecall
        controller.initialize(controller.address, initCap).should.be.rejectedWith('revert');
      });

      it('should mint a given amount of tokens to a given address', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        // mint some tokens
        const result = await token.mint(accounts[0], 100);
        // validate balance
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0.toNumber(), 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
      });

      it('should not allow to mint over the cap', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        // fail while trying to mint more than cap
        await token.mint(accounts[0], 200).should.be.rejectedWith('revert');
      });

      it('should allow to update controller', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        // mint some tokens
        let result = await token.mint(accounts[0], 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        // deploy new controller
        let newController = await Controller.new();
        //Transfer delegation = upgrade controller
        await proxy.transferDelegation(newController.address);
        // check wiring
        let delegation = await proxy.delegation();
        assert.equal(delegation, newController.address);
        // mint some more tokens on top
        result = await token.mint(accounts[0], 100);
        // validate supply
        totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 200);
      });
      /*
      it('should allow to update controller to another with different logic', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);
      //check params
      assert.equal(await token.name(), name);
      assert.equal(await token.symbol(), symbol);
      assert.equal(await token.decimals(), decimals);
      // deploy new controller
      let newController = await Controller2.new();
      //Transfer delegation = upgrade controller
      await proxy.transferDelegation(newController.address);
      // check wiring
      let delegation = await proxy.delegation();
      assert.equal(delegation, newController.address);
      //check params
      assert.equal(await token.name(), name2);
      assert.equal(await token.symbol(), symbol2);
      assert.equal(await token.decimals(), decimals2);
      // mint some tokens
      let result = await token.mint(accounts[0], 100);
      // validate supply
      let totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), 100);
      });
      */
      it('check ownership transfer', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);

      let other = accounts[1];
      await token.transferOwnership(other);
      let owner = await token.owner();

      assert.isTrue(owner === other);
      });

      it('should prevent non-owners from transfering ownership', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);
      const other = accounts[2];
      const owner = await token.owner.call();
      assert.isTrue(owner !== other);
      await token.transferOwnership(other, { from: other }).should.be.rejectedWith('revert');
      });

      it('should prevent non-owners to mint', async function () {
      // initialize contract
      await token.initialize(controller.address, 100);
      //transfer ownership
      let other = accounts[1];
      await token.transferOwnership(other);
      let owner = await token.owner();
      assert.isTrue(owner !== accounts[0]);
      // fail while trying to mint
      await token.mint(accounts[0], 100).should.be.rejectedWith('revert');
      });

      it('should prevent non-owners to update controller', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);
      // mint some tokens
      let result = await token.mint(accounts[0], 100);
      // validate supply
      let totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), 100);
      // deploy new controller
      let newController = await Controller.new();
      //transfer ownership
      let other = accounts[1];
      await token.transferOwnership(other);
      let owner = await token.owner();
      assert.isTrue(owner !== accounts[0]);
      //Fail when trying to update delegation by the non-owner
      await proxy.transferDelegation(newController.address).should.be.rejectedWith('revert');
      });

      it('should mint a given amount of tokens to a given address after ownership transfer', async function () {
      // initialize contract
      await token.initialize(controller.address, 100);
      //transfer ownership
      let other = accounts[1];
      await token.transferOwnership(other);
      let owner = await token.owner();
      assert.isTrue(owner !== accounts[0]);
      // mint some tokens
      const result = await token.mint(accounts[0], 100, {from: other});
      // validate balance
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0.toNumber(), 100);
      // validate supply
      let totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), 100);
      });

      it('should allow to update controller after ownership transfer', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);
      // mint some tokens
      let result = await token.mint(accounts[0], 100);
      // validate supply
      let totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), 100);
      //transfer ownership
      let other = accounts[1];
      await token.transferOwnership(other);
      let owner = await token.owner();
      assert.isTrue(owner !== accounts[0]);
      // deploy new controller
      let newController = await Controller.new({from: other});
      //Transfer delegation = upgrade controller
      await proxy.transferDelegation(newController.address,{from: other});
      // check wiring
      let delegation = await proxy.delegation();
      assert.equal(delegation, newController.address);
      // mint some more tokens on top
      result = await token.mint(accounts[0], 100, {from: other});
      // validate supply
      totalSupply = await token.totalSupply();
      assert.equal(totalSupply.toNumber(), 200);
      });

      it('should guard ownership against stuck state', async function () {
      // initialize contract
      await token.initialize(controller.address, 200);
      let originalOwner = await token.owner();
      await token.transferOwnership(null, { from: originalOwner }).should.be.rejectedWith('revert');
      });
    });

    describe('Lock checks', function () {
        it('only the owner can lock/unlock the sale', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // try to unlock by non-owner should be rejected
            await token.setUnlock(true, { from: accounts[1] }).should.be.rejectedWith('revert');
            // try to lock when already locked should be rejected
            await token.setUnlock(false).should.be.rejectedWith('revert');
            // lock enabled by owner
            await token.setUnlock(true);
            // try to lock by non-owner should be rejected
            await token.setUnlock(false, { from: accounts[1] }).should.be.rejectedWith('revert');
        });

        it('only the owner can authorize', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // try to set by non-owner should be rejected
            await token.setAuthorized(accounts[1], true, { from: accounts[1] }).should.be.rejectedWith('revert');
            // add authorized by owner
            await token.setAuthorized(accounts[1], true);
            let authorized = await token.authorized(accounts[1]);
            assert.equal(authorized, true);
            // try to add again to same address should be rejected
            await token.setAuthorized(accounts[1], true).should.be.rejectedWith('revert');
            // and adding others it is not allowed...
            await token.setAuthorized(accounts[2], true, { from: accounts[1] }).should.be.rejectedWith('revert');
            // unless by the token owner
            await token.setAuthorized(accounts[2], true);
            authorized = await token.authorized(accounts[2]);
            assert.equal(authorized, true);
        });

        it('should allow the owner to transfer while sale locked', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // mint some tokens
            const result = await token.mint(accounts[0], 100);
            // validate balance
            let balance0 = await token.balanceOf(accounts[0]);
            assert.equal(balance0.toNumber(), 100);
            // try to send from owner should work
            await token.transfer(accounts[1], 100);
            // validate balance
            let balance = await token.balanceOf(accounts[1]);
            assert.equal(balance.toNumber(), 100);
        });

        it('should not allow non-owners to transfer while sale locked', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // mint some tokens
            const result = await token.mint(accounts[0], 100);
            // validate balance
            let balance0 = await token.balanceOf(accounts[0]);
            assert.equal(balance0.toNumber(), 100);
            // try to send from owner should work
            await token.transfer(accounts[1], 100);
            // and to send back shouldn't work
            await token.transfer(accounts[0], 100, { from: accounts[1] }).should.be.rejectedWith('revert');
        });

        it('should allow non-owners to transfer while sale unlocked', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // saleLock enabled
            await token.setUnlock(true);
            // mint some tokens
            const result = await token.mint(accounts[0], 100);
            // validate balance
            let balance0 = await token.balanceOf(accounts[0]);
            assert.equal(balance0.toNumber(), 100);
            // try to send from owner should work
            await token.transfer(accounts[1], 100);
            // validate balance
            let balance1 = await token.balanceOf(accounts[1]);
            assert.equal(balance1.toNumber(), 100);
            // and to send back shouldn't work
            await token.transfer(accounts[0], 100, { from: accounts[1] });
            // validate balance
            let balance = await token.balanceOf(accounts[0]);
            assert.equal(balance.toNumber(), 100);
        });

        it('should allow sale address to transfer while sale locked', async function () {
            // initialize contract
            await token.initialize(controller.address, 100);
            // unlock token
            await token.setUnlock(true);
            // mint some tokens
            const result = await token.mint(accounts[0], 100);
            // validate balance
            let balance0 = await token.balanceOf(accounts[0]);
            assert.equal(balance0.toNumber(), 100);
            // try to send from owner should work
            await token.transfer(accounts[1], 100);
            // validate balance
            let balance1 = await token.balanceOf(accounts[1]);
            assert.equal(balance1.toNumber(), 100);
            //authorize accounts[1]
            token.setAuthorized(accounts[1], true);
            // and since accounts[1] is authorized, to send back should work too
            token.transfer(accounts[0], 100, { from: accounts[1] })
            // validate balance
            let balance = await token.balanceOf(accounts[0]);
            assert.equal(balance.toNumber(), 100);
        });

        it('only the owner and authorized can set and modify allowances while the sale is locked', async function () {
            let owner = accounts[0];
            let authorized = accounts[1];
            let other = accounts[2];
            let receiver = accounts[3];
            // initialize contract
            await token.initialize(controller.address, 1000);
            await token.setAuthorized(authorized, true);
            // mint some tokens
            await token.mint(owner, 100);
            await token.mint(authorized, 100);
            await token.mint(other, 100);
            // try to approve by non-owner should be rejected, but work for owner and sale
            await token.approve(receiver,20);
            await token.approve(receiver,20, { from: authorized });
            await token.approve(receiver,20, { from: other }).should.be.rejectedWith('revert');
            // check allowances
            let ownerAllow = await token.allowance(owner, receiver);
            assert.equal(ownerAllow,20);
            let saleAllow = await token.allowance(authorized, receiver);
            assert.equal(saleAllow,20);
            let otherAllow = await token.allowance(other, receiver);
            assert.equal(otherAllow,0);
            //try to increase/decrease allowances
            await token.increaseApproval(receiver,20);
            await token.decreaseApproval(receiver,10, { from: authorized });
            // re-check allowances
            ownerAllow = await token.allowance(owner, receiver);
            assert.equal(ownerAllow,40);
            saleAllow = await token.allowance(authorized, receiver);
            assert.equal(saleAllow,10);
            otherAllow = await token.allowance(other, receiver);
            assert.equal(otherAllow,0);
            // receiver can't transferFrom owner, sale is Locked
            token.transferFrom(owner, receiver, 10, { from: receiver }).should.be.rejectedWith('revert');
            // unlock by owner
            await token.setUnlock(true);
            // receiver transferFrom owner to himself
            token.transferFrom(owner, receiver, 10, { from: receiver });
            // re-check allowance
            ownerAllow = await token.allowance(owner, receiver);
            assert.equal(ownerAllow,30);
            // check final balances
            let balanceOwner = await token.balanceOf(owner);
            assert.equal(balanceOwner.toNumber(), 90);
            let balanceReceiver = await token.balanceOf(receiver);
            assert.equal(balanceReceiver.toNumber(), 10);
        });
    });
});

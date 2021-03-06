pragma solidity 0.4.24;

import "../Controller.sol";
import "../extensions/Whitelisted.sol";
import "../extensions/NAdmin.sol";


/**
 * @title Whitelist and Admin token
 * @dev ILM token modified with whitelist and Admin list functionalities.
 **/
contract WAILM is Controller, Whitelisted, NAdmin {

    constructor() public {}

    modifier onlyAdmins() {
        require(msg.sender==owner || isAdmin(msg.sender), "Owner or Admin rights required.");
        _;
    }

    modifier onlyWhitelisted() {
        require(msg.sender==owner || whitelistUnlocked || isWhitelisted(msg.sender), "Owner or Whitelist rights required.");
        _;
    }

    function setWhitelistUnlock(bool _newStatus) public onlyAdmins {
        super.setWhitelistUnlock(_newStatus);
    }

    /**
     * @dev Allows admins to add people to the whitelist.
     * @param _toAdd The address to be added to whitelist.
     */
    function addToWhitelist(address _toAdd) public onlyAdmins {
        super.addToWhitelist(_toAdd);
    }

    function addListToWhitelist(address[] _toAdd) public onlyAdmins {
        super.addListToWhitelist(_toAdd);
    }

    function removeFromWhitelist(address _toRemove) public onlyAdmins {
        super.removeFromWhitelist(_toRemove);
    }

    function removeListFromWhitelist(address[] _toRemove) public onlyAdmins {
        super.removeListFromWhitelist(_toRemove);
    }

    /**
     * @dev Allows admins to add people to the admin list.
     * @param _toAdd The address to be added to admin list.
     */
    function addToAdmins(address _toAdd) public onlyAdmins {
        super.addToAdmins(_toAdd);
    }

    function addListToAdmins(address[] _toAdd) public onlyAdmins {
        super.addListToAdmins(_toAdd);
    }

    function removeFromAdmins(address _toRemove) public onlyAdmins {
        super.removeFromAdmins(_toRemove);
    }

    function removeListFromAdmins(address[] _toRemove) public onlyAdmins {
        super.removeListFromAdmins(_toRemove);
    }

    /**
     * @dev Only whitelisted can transfer tokens, and only to whitelisted addresses
     * @param _to The address where tokens will be sent to
     * @param _value The amount of tokens to be sent
     */
    function transfer(address _to, uint256 _value) public onlyWhitelisted returns(bool) {
        //If the destination is not whitelisted, try to add it (only admins modifier)
        if(!isWhitelisted(_to) && !whitelistUnlocked) addToWhitelist(_to);
        return super.transfer(_to, _value);
    }

    /**
     * @dev Only whitelisted can transfer tokens, and only to whitelisted addresses. Also, the msg.sender will need to be approved to do it
     * @param _from The address where tokens will be sent from
     * @param _to The address where tokens will be sent to
     * @param _value The amount of tokens to be sent
     */
    function transferFrom(address _from, address _to, uint256 _value) public onlyWhitelisted returns (bool) {
        //If the source is not whitelisted, try to add it (only admins modifier)
        if(!isWhitelisted(_from) && !whitelistUnlocked) addToWhitelist(_from);
        //If the destination is not whitelisted, try to add it (only admins modifier)
        if(!isWhitelisted(_to) && !whitelistUnlocked) addToWhitelist(_to);
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Allow others to spend tokens from the msg.sender address. The spender should be whitelisted
     * @param _spender The address to be approved
     * @param _value The amount of tokens to be approved
     */
    function approve(address _spender, uint256 _value) public onlyWhitelisted returns (bool) {
        //If the approve spender is not whitelisted, try to add it (only admins modifier)
        if(!isWhitelisted(_spender) && !whitelistUnlocked) addToWhitelist(_spender);
        return super.approve(_spender, _value);
    }

}

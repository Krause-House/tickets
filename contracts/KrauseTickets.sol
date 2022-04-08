// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract KrauseTickets is
    ERC1155Upgradeable,
    OwnableUpgradeable,
    IERC721Receiver
{
    event Exchanged(
        address exchanger,
        uint256 legacyTokenId,
        address legacyContract
    );

    string private baseUri;

    uint256 public constant upperLevelId = 0;
    address public legacyUpperLevel;

    uint256 public constant clubLevelId = 1;
    address public legacyClubLevel;

    uint256 public constant courtsideId = 2;
    address public legacyCourtside;

    uint256 public royaltyFeeInBips; // 1% = 100
    address public royaltyReceiver;

    function initialize(
        address _legacyUpperLevel,
        address _legacyClubLevel,
        address _legacyCourtside,
        string memory _uri
    ) public initializer {
        legacyUpperLevel = _legacyUpperLevel;
        legacyClubLevel = _legacyClubLevel;
        legacyCourtside = _legacyCourtside;
        baseUri = _uri;
        royaltyReceiver = msg.sender;
        __ERC1155_init("");
        __Ownable_init();
    }

    /// @notice Query if a contract implements an interface
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 interfaceID)
        public
        view
        override(ERC1155Upgradeable)
        returns (bool)
    {
        return
            bytes4(keccak256("royaltyInfo(uint256,uint256)")) == interfaceID ||
            super.supportsInterface(interfaceID);
    }

    function getUri(string memory id) external view returns (string memory) {
        return string(abi.encodePacked(baseUri, "/", id));
    }

    function uri(uint256) public pure override returns (string memory) {
        require(false, "KrauseTickets: Unsupported method");
        return "";
    }

    function setUri(string memory _uri) external onlyOwner {
        baseUri = _uri;
    }

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _salePrice - the sale price of the NFT asset specified by _tokenId
    /// @return receiver - address of who should be sent the royalty payment
    /// @return royaltyAmount - the royalty payment amount for _salePrice
    function royaltyInfo(uint256, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyReceiver, _calculateRoyalty(_salePrice));
    }

    /// @notice allow setting royalty info
    /// @param _royaltyReceiver address of the receiver of the royalty
    /// @param _royaltyFeeInBips royalty fee in bips (100 = 1%)
    function setRoyaltyInfo(address _royaltyReceiver, uint256 _royaltyFeeInBips)
        external
        onlyOwner
    {
        royaltyReceiver = _royaltyReceiver;
        royaltyFeeInBips = _royaltyFeeInBips;
    }

    /// @notice Callback for receiving an ERC721 mints a ticket if the token was a legacy NFT
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        if (msg.sender == legacyUpperLevel) {
            _exchangeUpperLevel(from);
        } else if (msg.sender == legacyClubLevel) {
            _exchangeClubLevel(from);
        } else if (msg.sender == legacyCourtside) {
            _exchangeCourtside(from);
        } else {
            return this.onERC721Received.selector;
        }

        emit Exchanged(from, tokenId, msg.sender);
        return this.onERC721Received.selector;
    }

    /// @notice Mint an upper level ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeUpperLevel(address to) private {
        _mint(to, upperLevelId, 1, "");
    }

    /// @notice Mint a club level ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeClubLevel(address to) private {
        _mint(to, clubLevelId, 1, "");
    }

    /// @notice Mint a courtside ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeCourtside(address to) private {
        _mint(to, courtsideId, 1, "");
    }

    /// @notice Calculates royalty amount based on token's sale price
    /// @dev Divides sale price by 10000 since 10000 bips = 100%
    /// @param _salePrice The sale price of token in wei
    function _calculateRoyalty(uint256 _salePrice)
        private
        view
        returns (uint256)
    {
        return (_salePrice / 10000) * royaltyFeeInBips;
    }
}

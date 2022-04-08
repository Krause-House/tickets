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
        __ERC1155_init("");
        __Ownable_init();
    }

    function getUri(string memory id) external view returns (string memory) {
        return string(abi.encodePacked(baseUri, "/", id));
    }

    function uri(uint256) public pure override returns (string memory) {
        require(false, "KrauseTickets: Unsupported method");
        return "";
    }

    function setUri(string memory _uri) public onlyOwner {
        baseUri = _uri;
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
    function _exchangeUpperLevel(address to) internal {
        _mint(to, upperLevelId, 1, "");
    }

    /// @notice Mint a club level ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeClubLevel(address to) internal {
        _mint(to, clubLevelId, 1, "");
    }

    /// @notice Mint a courtside ticket for user
    /// @param to The address to mint the ticket to
    function _exchangeCourtside(address to) internal {
        _mint(to, courtsideId, 1, "");
    }
}

export const abiEth2ArbSendService = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_dao",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_inbox",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_remoteChainId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "REMOTE_CHAINID",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "appPairs",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "appAddress",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "enable",
          "type": "bool"
        }
      ],
      "name": "authoriseAppCaller",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "callerWhiteList",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "dao",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_maxSubmissionCost",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_l2GasPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_l2GasLimit",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_refunder",
          "type": "address"
        }
      ],
      "name": "encodeParams",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_callSize",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_l1GasPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_l2GasPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_l2GasLimit",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_percentIncrease",
          "type": "uint256"
        }
      ],
      "name": "fee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "inbox",
      "outputs": [
        {
          "internalType": "contract IInbox",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "operator",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_remoteChainId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_remoteBridge",
          "type": "address"
        }
      ],
      "name": "registerRemoteReceiver",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "remoteMessager",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_remoteChainId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "_message",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "_params",
          "type": "bytes"
        }
      ],
      "name": "sendMessage",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_operator",
          "type": "address"
        }
      ],
      "name": "setOperator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_remoteMessager",
          "type": "address"
        }
      ],
      "name": "setRemoteMessager",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_dao",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

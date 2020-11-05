var MODE = 'DEV'; // 'PROD';

var addresss = '';
var ignition = '';
var balance = { trnd: 0, xtrnd: 0, univ2: 0 };
var monitoringTokensInterval = undefined;
var monitoringPoolsInterval = undefined;

const connectWallet = $('#connectWallet');
const connectWalletIcon = $('#connectWallet .icon i');
const connectWalletLabel = $('#connectWallet .text');

const userDropdown = $('#userDropdown');
const userAddress = $('#userAddress');

const connectWalletSuccess = (text, large = true) => {
  connectWallet.show();
  connectWallet.removeClass().addClass('btn btn-success btn-icon-split' + (large == true ? ' btn-lg' : ''));
  connectWalletIcon.removeClass().addClass('fas fa-check');
  connectWalletLabel.text(text);
}

const connectWalletWarning = (text, large = false) => {
  connectWallet.show();
  connectWallet.removeClass().addClass('btn btn-warning btn-icon-split' + (large == true ? ' btn-lg' : ''));
  connectWalletIcon.removeClass().addClass('fas fa-info-circle');
  connectWalletLabel.text(text);
}

const connectWalletError = (text, href, large = false) => {
  connectWallet.show();
  connectWallet.removeClass().addClass('btn btn-danger btn-icon-split' + (large == true ? ' btn-lg' : ''));
  connectWalletIcon.removeClass().addClass('fas fa-exclamation-triangle');
  connectWalletLabel.text(text);
  connectWallet.attr('href',href);
}

const connectAddress = (address) => {
  return address.replace('x','👩‍🌾');
}

const checksumAddress = (address) => {
  var t = address;

  if (void 0 === t)
    return "";

  if (!/^(0x)?[0-9a-f]{40}$/i.test(t))
    return t;

  t = t.toLowerCase().replace(/^0x/i, "");

  for (var r = keccak256(t).replace(/^0x/i, ""), i = "0x", e = 0; e < t.length; e++)
    7 < parseInt(r[e], 16) ? i += t[e].toUpperCase() : i += t[e];

  return i;     
}

const put = (path, payload, done, fail) => {
  var api = MODE == 'PROD' ? '/socket' : 'api';
  $.ajax({
    url: api + path + (MODE == 'PROD' ? '' : '.json?random=' + Math.random().toString(36).substring(7)),
    method: MODE == 'PROD' ? 'PUT' : 'GET',
    data: {
      ignition: ignition,
      payload: payload
    }
  })
  .done(done)
  .fail(fail);
}

const initializeWorkspace = () => {
  $('#menu-control').click(loadControl);
  $('#menu-govern').click(loadGovern);
  $('#menu-govern-drafts').click(loadGovernDrafts);
  $('#menu-monitoring-tokens').click(loadMonitoringTokens);
  $('#menu-monitoring-tokens-abc').click(loadMonitoringTokensABC);
  $('#menu-monitoring-pools').click(loadMonitoringPools);
  // $('#menu-staking').click(loadStaking);
}

const showWorkspace = (space,html) => {
  $('.sidebar .nav-item').removeClass('active');
  $('.sidebar .collapse-item').removeClass('active');

  if (space == 'control') {
    $('.sidebar #menu-' + space).parent().addClass('active');
  }
  else {
    $('.sidebar #menu-' + space).parent().parent().parent().addClass('active');
    $('#menu-' + space).addClass('active');
  }

  $('#workspace > div').hide();
  $('#workspace > #' + space).html(html);
  $('#workspace > #' + space).show();

  history.replaceState({}, '', '#' + space);
}

const updateWorkspace = (space,html) => {
  $('#workspace > #' + space).html(html);
}

const initialize = () => {
  const onClickConnect = async () => {

    try {
      const accounts = [
        '0x000000000000000000000000000000000000dEaD'
      ];

      if (MODE == 'PROD') {
        await ethereum.request({ method: 'eth_requestAccounts' });
        accounts = await ethereum.request({ method: 'eth_accounts' })
      }

      if (accounts[0]) {
        address = accounts[0];

        connectWalletLabel.text('Connecting...');

        userAddress.text(address);
        userDropdown.attr('href','https://etherscan.io/address/' + address);  

        put(
          // path
          '/ignite',
          // payload
          { address: connectAddress(address) },
          // done
          function(data) {
            if (data.result == 'OK') {
              ignition = data.ignition;
              balance = data.balance;

              connectWallet.hide();
              connectWalletLabel.text('Connect MetaMask');
              loadControl();
            }
            if (data.result == 'Err') {
              connectWalletError(data.message, data.href);
            }
            
          },
          // fail
          function(data) {
            connectWalletError('Authentication failed. Please reload the page.');
          }
        );
      }
    } catch (error) {
      connectWalletError(error.message + '. Try again?');
    }
  };

  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const MetamaskClientCheck = () => {
    if (! isMetaMaskInstalled() && MODE == 'PROD') {
      connectWalletWarning('Please install a MetaMask-compatible wallet first');
      connectWallet.attr('href','https://metamask.io');
    } else {
      connectWalletLabel.text('Connect MetaMask');
      connectWallet.click(onClickConnect);
      onClickConnect();
    }
  };

  initializeWorkspace();
  MetamaskClientCheck();
}

const loadControl = () => {
  put(
    // path
    '/workspace/control',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        data.message = data.message.replace('{balance_trnd}',balance.trnd);
        data.message = data.message.replace('{balance_xtrnd}',balance.xtrnd);

        showWorkspace('control',data.message);
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        data.responseText = data.responseText.replace('{balance_trnd}','17');
        data.responseText = data.responseText.replace('{balance_xtrnd}','170,000');
        data.responseText = data.responseText.replace('{fueldepo_xtrnd}','1,717');

        showWorkspace('control',data.responseText);
      }
    }
  );
}

const loadGovern = () => {
  put(
    // path
    '/workspace/govern',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        data.message = data.message.replace('{balance_trnd}',balance.trnd);
        data.message = data.message.replace('{balance_xtrnd}',balance.xtrnd);

        showWorkspace('govern',data.message);

        $('form.rfc-form').submit(function(event){
          event.preventDefault();

          var formId = $(this).attr('id');
          var tipId = $('#' + formId + ' .rfc-tip').val();
          var tipComment = $('#' + formId + ' .rfc-comment').val();

          put(
            // path
            '/workspace/govern/rfc',
            // payload
            { tip: tipId, comment: tipComment },
            // done
            function(data) {
              if (data.result == 'OK') {
                loadGovern();
              }
              if (data.result == 'Err') {
                connectWalletError(data.message, data.href);
              }
            },
            // fail
            function() {
              connectWalletError('Authentication failed. Please reload the page.');
            }
          );

          return false;
        });
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        data.responseText = data.responseText.replace('{balance_trnd}','17');
        data.responseText = data.responseText.replace('{balance_xtrnd}','170,000');
        data.responseText = data.responseText.replace('{fueldepo_xtrnd}','1,717');

        showWorkspace('govern',data.responseText);
      }
    }
  );
}

const loadGovernDrafts = () => {
  put(
    // path
    '/workspace/govern-drafts',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        data.message = data.message.replace('{balance_trnd}',balance.trnd);
        data.message = data.message.replace('{balance_xtrnd}',balance.xtrnd);

        showWorkspace('govern',data.message);

        $('form.rfc-form').submit(function(event){
          event.preventDefault();

          var formId = $(this).attr('id');
          var tipId = $('#' + formId + ' .rfc-tip').val();
          var tipComment = $('#' + formId + ' .rfc-comment').val();

          put(
            // path
            '/workspace/govern-drafts/rfc',
            // payload
            { tip: tipId, comment: tipComment },
            // done
            function(data) {
              if (data.result == 'OK') {
                loadGovern();
              }
              if (data.result == 'Err') {
                connectWalletError(data.message, data.href);
              }
            },
            // fail
            function() {
              connectWalletError('Authentication failed. Please reload the page.');
            }
          );

          return false;
        });
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        data.responseText = data.responseText.replace('{balance_trnd}','17');
        data.responseText = data.responseText.replace('{balance_xtrnd}','170,000');
        data.responseText = data.responseText.replace('{fueldepo_xtrnd}','1,717');

        showWorkspace('govern-drafts',data.responseText);
      }
    }
  );
}

const loadMonitoringTokens = () => {
  put(
    // path
    '/workspace/monitoring/tokens',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        showWorkspace('monitoring-tokens',data.message);

        setTimeout(function () {
          $('#monitoring-tokens .token-logo').each(function(index, el) {
            var address = $(el).attr('data-address');
            var source = $(el).attr('data-src');

            address = checksumAddress(address);
            source = source.replace('{address}',address);

            $(el).attr('src',source);

            if (el.naturalWidth != 'undefined' && el.naturalWidth != 0) {

            }
            else {
              $(el).attr('src','/dapp/img/no-icon.png');
            }
          });
        }, 500);
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        showWorkspace('monitoring-tokens',data.responseText);
      }
    }
  );

  if (monitoringTokensInterval === undefined && MODE == 'PROD') {

    monitoringTokensInterval = setInterval(function(){

      put(
        // path
        '/workspace/monitoring/tokens',
        // payload
        { address: address },
        // done
        function(data) {
          if (data.result == 'OK') {
            updateWorkspace('monitoring-tokens',data.message);

            setTimeout(function () {
              $('#monitoring-tokens .token-logo').each(function(index, el) {
                var address = $(el).attr('data-address');
                var source = $(el).attr('data-src');

                address = checksumAddress(address);
                source = source.replace('{address}',address);

                $(el).attr('src',source);

                if (el.naturalWidth != 'undefined' && el.naturalWidth != 0) {

                }
                else {
                  $(el).attr('src','/dapp/img/no-icon.png');
                }
              });
            }, 500);
          }
          if (data.result == 'Err') {
            connectWalletError(data.message, data.href);
          }
        },
        // fail
        function() {
          connectWalletError('Authentication failed. Please reload the page.');
        }
      );

    },30000);

  }
}

const loadMonitoringTokensABC = () => {
  put(
    // path
    '/workspace/monitoring/tokens',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        showWorkspace('monitoring-tokens-abc',data.message);

        setTimeout(function () {
          $('#monitoring-tokens-abc .token-logo').each(function(index, el) {
            var address = $(el).attr('data-address');
            var source = $(el).attr('data-src');

            address = checksumAddress(address);
            source = source.replace('{address}',address);

            $(el).attr('src',source);

            if (el.naturalWidth != 'undefined' && el.naturalWidth != 0) {

            }
            else {
              $(el).attr('src','/dapp/img/no-icon.png');
            }
          });
        }, 500);
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        showWorkspace('monitoring-tokens-abc',data.responseText);
      }
    }
  );
}

const loadMonitoringPools = () => {
  put(
    // path
    '/workspace/monitoring/pools',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        showWorkspace('monitoring-pools',data.message);

        setTimeout(function () {
          $('#monitoring-pools .token-logo').each(function(index, el) {
            var address = $(el).attr('data-address');
            var source = $(el).attr('data-src');

            address = checksumAddress(address);
            source = source.replace('{address}',address);

            $(el).attr('src',source);

            if (el.naturalWidth != 'undefined' && el.naturalWidth != 0) {

            }
            else {
              $(el).attr('src','/dapp/img/no-icon.png');
            }
          });
        }, 500);
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function(data) {
      if (MODE == 'PROD') {
        connectWalletError('Authentication failed. Please reload the page.');
      }
      else {
        showWorkspace('monitoring-pools',data.responseText);
      }
    }
  );

  if (monitoringPoolsInterval === undefined && MODE == 'PROD') {

    monitoringPoolsInterval = setInterval(function() {

      put(
        // path
        '/workspace/monitoring/pools',
        // payload
        { address: address },
        // done
        function(data) {
          if (data.result == 'OK') {
            updateWorkspace('monitoring-pools',data.message);

            setTimeout(function () {
              $('#monitoring-pools .token-logo').each(function(index, el) {
                var address = $(el).attr('data-address');
                var source = $(el).attr('data-src');

                address = checksumAddress(address);
                source = source.replace('{address}',address);

                $(el).attr('src',source);

                if (el.naturalWidth != 'undefined' && el.naturalWidth != 0) {

                }
                else {
                  $(el).attr('src','/dapp/img/no-icon.png');
                }
              });
            }, 500);
          }
          if (data.result == 'Err') {
            connectWalletError(data.message, data.href);
          }
        },
        // fail
        function() {
          connectWalletError('Authentication failed. Please reload the page.');
        }
      );

    },30000);

  }
}

const loadStaking = () => {
  put(
    // path
    '/workspace/staking',
    // payload
    { address: address },
    // done
    function(data) {
      if (data.result == 'OK') {
        showWorkspace('staking',data.message);
      }
      if (data.result == 'Err') {
        connectWalletError(data.message, data.href);
      }
    },
    // fail
    function() {
      connectWalletError('Authentication failed. Please reload the page.');
    }
  );
}

window.addEventListener('DOMContentLoaded', initialize);

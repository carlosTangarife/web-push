var fs = require('fs');

if (process.argv.length < 3 || !fs.existsSync(process.argv[2])) {
  throw new Error('The third argument should be the path to the browser executable.');
}

var server = require('./server');

server.pushPayload = process.argv[3];

var webdriver = require('selenium-webdriver'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until;

var firefox = require('selenium-webdriver/firefox');

var profile = new firefox.Profile();
profile.acceptUntrustedCerts();
profile.setPreference('security.turn_off_all_security_so_that_viruses_can_take_over_this_computer', true);

var firefoxBinary = new firefox.Binary(process.argv[2]);

var firefoxOptions = new firefox.Options().setProfile(profile).setBinary(firefoxBinary);

var chrome = require('selenium-webdriver/chrome');

var chromeOptions = new chrome.Options().setChromeBinaryPath(process.argv[2]).addArguments('--no-sandbox');

var driver = new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(firefoxOptions)
  .setChromeOptions(chromeOptions)
  .build();

driver.wait(function() {
  return server.listening;
});
driver.executeScript(function() {
  if (typeof netscape !== 'undefined') {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    Components.utils.import('resource://gre/modules/Services.jsm');
    var uri = Services.io.newURI('https://127.0.0.1:50005', null, null);
    var principal = Services.scriptSecurityManager.getNoAppCodebasePrincipal(uri);
    Services.perms.addFromPrincipal(principal, 'push', Services.perms.ALLOW_ACTION);
  }
});
/*
This currently doesn't work in Firefox Nightly.
driver.get('https://127.0.0.1:50005');
*/
driver.executeScript(function() {
  window.location = 'https://127.0.0.1:50005';
});
driver.sleep(1000);
driver.wait(until.titleIs(server.pushPayload ? server.pushPayload : 'no payload'), 60000);
driver.quit().then(function() {
  server.close();
});

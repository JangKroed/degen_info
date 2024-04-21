document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get(['userInfo'], function (result) {
    if (!result.userInfo) {
      chrome.tabs.query({}, function (tabs) {
        let target_id = '';

        for (const tab of tabs) {
          if (tab.url) {
            if (tab.url.includes('www.supercast.xyz')) {
              target_id = tab.id;
              break;
            }

            if (tab.url.includes('warpcast.com')) {
              target_id = tab.id;
              break;
            }
          }
        }

        if (target_id) {
          chrome.scripting.executeScript({
            target: { tabId: target_id },
            files: ['content-script.js'],
          });
        }
      });
    } else {
      setUserInfo();
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('mainPage').style.display = 'block';
    }
  });
});

async function responseToJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return Array.isArray(jsonData) ? jsonData[0] : jsonData;
  } catch (error) {
    console.error('Failed to fetch or parse response:', error);
  }
}

async function getUserinfo(fid) {
  const { user } = await responseToJson(`https://www.supercast.xyz/api/profile?fid=${fid}`);

  const { username, avatar, connectedAddress: address, displayName } = user;

  const avatarElement = document.getElementById('avatar');
  const displayNameElement = document.getElementById('displayName');
  const usernameElement = document.getElementById('username');
  const rankElement = document.getElementById('rank');
  const dailyAllowanceElement = document.getElementById('dailyAllowance');
  const remainingElement = document.getElementById('remaining');
  const pointsElement = document.getElementById('points');

  avatarElement.src = avatar;
  displayNameElement.textContent = displayName;
  usernameElement.textContent = `@${username}`;

  const USE_POINT_URL = `http://localhost:1005/points?address=${address}`;
  const USE_TIP_URL = `http://localhost:1005/tips?address=${address}`;

  const { points: My_Point } = await responseToJson(USE_POINT_URL);
  const { user_rank, tip_allowance, remaining_allowance } = await responseToJson(USE_TIP_URL);

  pointsElement.textContent = My_Point;
  rankElement.textContent = user_rank;
  dailyAllowanceElement.textContent = tip_allowance;
  remainingElement.textContent = remaining_allowance;

  const userInfo = { username, avatar, address, displayName, My_Point, user_rank, tip_allowance, remaining_allowance };
  chrome.storage.local.set({ userInfo });
}

function setUserInfo() {
  chrome.storage.local.get(['userInfo'], function (result) {
    if (result.userInfo) {
      const { username, avatar, displayName, My_Point, user_rank, tip_allowance } = result.userInfo;

      const avatarElement = document.getElementById('avatar');
      const displayNameElement = document.getElementById('displayName');
      const usernameElement = document.getElementById('username');
      const rankElement = document.getElementById('rank');
      const dailyAllowanceElement = document.getElementById('dailyAllowance');
      const pointsElement = document.getElementById('points');

      avatarElement.src = avatar;
      displayNameElement.textContent = displayName;
      usernameElement.textContent = `@${username}`;

      pointsElement.textContent = My_Point;
      rankElement.textContent = user_rank;
      dailyAllowanceElement.textContent = tip_allowance;
      getUseTipResult();
    }
  });
}

if (document.getElementById('username')) {
  document.getElementById('username').addEventListener('click', function () {
    const username = document.getElementById('username').textContent;

    if (username) {
      const link = `https://supercast.xyz/${username.substring(1, username.length)}`;
      chrome.tabs.create({ url: link });
    }
  });
}

if (document.getElementById('avatar')) {
  document.getElementById('avatar').addEventListener('click', function () {
    const avatar = document.getElementById('avatar').src;

    if (avatar) {
      chrome.tabs.create({ url: avatar });
    }
  });
}

if (document.getElementById('pleaseLogin')) {
  document.getElementById('pleaseLogin').addEventListener('click', function () {
    chrome.tabs.create({ url: 'https://www.supercast.xyz' });
  });
}

if (document.getElementById('moveToSidebarButton')) {
  document.getElementById('moveToSidebarButton').addEventListener('click', function () {
    chrome.windows.getCurrent(function (window) {
      if (window) {
        chrome.sidePanel
          .open({ windowId: window.id })
          .then(() => {
            console.log('Side panel opened successfully.');
          })
          .catch((error) => {
            console.error('Failed to open side panel:', error);
          });
      }
    });
  });
}

function isWithinRange(targetDateString) {
  const now = new Date();
  const targetDate = new Date(targetDateString);
  const eightAM = 8;

  const currentHourUTC = now.getUTCHours();

  function createUTCDate(dayOffset) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const date = now.getUTCDate() + dayOffset;

    return new Date(Date.UTC(year, month, date, eightAM));
  }

  let startOfRange, endOfRange;
  if (currentHourUTC < eightAM) {
    startOfRange = createUTCDate(-2);
    endOfRange = createUTCDate(-1);
  } else {
    startOfRange = createUTCDate(-1);
    endOfRange = createUTCDate(0);
  }

  return startOfRange <= targetDate && targetDate > endOfRange;
}

function getDegen(text) {
  const regex = /(\d+)\s*\$DEGEN/i;
  const match = text.match(regex);

  return match ? parseInt(match[1], 10) : null;
}

function getUseTipResult() {
  chrome.storage.local.get(['fid'], async function (result) {
    if (result.fid) {
      const { fid } = result;
      const GET_REPLY_URL = `https://www.supercast.xyz/api/user/replies?cursor=&profileFid=${fid}&ownerFid=${fid}`;

      let response = await responseToJson(GET_REPLY_URL);

      let trigger = true;
      let use_degen = 0;

      while (trigger) {
        for (const { author, text, parent_url, timestamp } of response.casts) {
          if (author.fid === fid && !parent_url) {
            const degen = getDegen(text);
            if (degen) {
              use_degen += degen;
            }
          }

          if (!isWithinRange(timestamp)) {
            trigger = false;
            break;
          }
        }

        if (trigger) {
          const url = `https://www.supercast.xyz/api/user/replies?cursor=${response.cursor}&profileFid=${fid}&ownerFid=${fid}`;
          response = await responseToJson(url);
        } else {
          break;
        }
      }

      const dailyAllowanceElement = document.getElementById('dailyAllowance');
      const remaining = document.getElementById('remaining');
      const use_remaining = Math.floor(Number(dailyAllowanceElement.textContent) - use_degen);
      remaining.textContent = use_remaining;
      chrome.storage.local.get(['userInfo'], function (result) {
        if (result.userInfo) {
          const userInfo = {
            ...result.userInfo,
            remaining_allowance: use_remaining,
          };

          chrome.storage.local.set({ userInfo }, function () {
            console.log('remaining_allowance update.');
          });
        }
      });
    }
  });
}

if (document.getElementById('refresh')) {
  document.getElementById('refresh').addEventListener('click', function () {
    getUseTipResult();
  });
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === 'logout') {
    chrome.storage.local.clear(function () {
      console.log('User logged out successfully.');
    });
  }
  if (request.fid) {
    chrome.storage.local.set({ fid: request.fid }, function () {
      console.log('chrome storage save the fid.');
    });

    await getUserinfo(request.fid);
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
  }
});

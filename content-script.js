var responseToJson = async (res) => {
  try {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const jsonData = res;
    console.log(JSON.stringify(res));
    return Array.isArray(jsonData) ? jsonData[0] : jsonData;
  } catch (error) {
    console.error(error);
    return null;
  }
};

function setUserinfo(fid) {
  const GET_PROFILE_URL = `https://www.supercast.xyz/api/profile?fid=${fid}`;
  const { username, avatar, connectedAddress: address, displayName } = fetch(GET_PROFILE_URL).then(responseToJson).catch(console.error);

  const USE_POINT_URL = `https://www.degen.tips/api/airdrop2/season3/points?address=${address}`;
  const USE_TIP_URL = `https://www.degen.tips/api/airdrop2/tip-allowance?address=${address}`;

  console.error(USE_POINT_URL);

  const { points: my_point } = fetch(USE_POINT_URL).then(responseToJson).catch(console.error);
  const { user_rank, tip_allowance, remaining_allowance } = fetch(USE_TIP_URL).then(responseToJson).catch(console.error);

  const userInfo = {
    username,
    avatar,
    address,
    displayName,
    my_point,
    user_rank,
    tip_allowance,
    remaining_allowance,
  };

  chrome.runtime.sendMessage({ action: 'LOGIN_SUCCESS', fid, address, userInfo });
}

function getItem(key) {
  return JSON.parse(localStorage.getItem(key));
}

var data = getItem('currentSupercastFID');

if (data) {
  setUserinfo(data);
} else {
  const item = getItem('REACT_QUERY_OFFLINE_CACHE');
  if (item?.clientState) {
    setUserinfo(item.clientState.queries[0].queryKey[1]);
  }
}

// Whew, this JS is a bit complex. Lemme walk you through it

var serverList = {};

document.getElementsByClassName("find-home-button")[0].addEventListener("click", async () => {
  // We'll first change the text of the find home button
  const findHomeBtn = document.getElementsByClassName("find-home-button")[0];
  findHomeBtn.textContent = "Finding your brotherhood.."

  // ..Then we'll change the globe gif to a faster one, both to tell the user something is happening
  const globeImg = document.getElementsByClassName("globe")[0];
  globeImg.src = "assets/img/stage1/Rotating_earth_animated_transparent_fast.gif"

  // We'll disable it so they cannot trigger this 5000 times and break anything
  findHomeBtn.disabled = true;

  // Call the API to find the closest server
  const joinBtn = document.getElementsByClassName('join-button')[0];

  // Get the servers from the API, preload everything
  const res = await fetchPlus(
    'https://find-bros.vercel.app/api/servers', {}, 5
  ).then((res) => res).catch((e) => {
    console.log(e);
    joinBtn.innerText = 'An error has occurred, brother. Please try again later.';
  });

  // If there's a server for the country it was requested from
  if (res && res.geoServer) {

    // Set the current country to that
    await setCurrentCountry(res.geoServer.country, res.geoServer.cc, res.geoServer.invite, false);

    // Preload the server list if they want to select a different country
    for (const server of res.serverList) {
      serverList[server.match.toLowerCase()] = server;
    }

  } else if (res && !res.geoServer) {
    // If there is no server for the country it was requested from.. encourage them to make one
    document.getElementsByClassName("country-wrapper")[0].style.display = "none";
    document.getElementsByClassName("no-country-found-wrapper")[0].style.display = "inline-flex";
  } else {
    // If some stupid networking error happens, just auto-reload the page after 5 seconds.
    // A lazy way to not have to code in network error request retrying and all of that bollocks..
    await sleep(2000);
    location.reload();
  }

  // Then, we'll prepare to fade out the stage 1 page...

  await sleep(2000);

  // Set the stage 1 wrapper to fade out
  const stage1Wrapper = document.getElementById("stage-1");
  stage1Wrapper.classList.toggle("fade-out");
  await sleep(2000);
  stage1Wrapper.style.display = "none";

  // Once that's done, fade in the new stage 2 wrapper.
  const stage2Wrapper = document.getElementById("stage-2");
  stage2Wrapper.style.display = "block";
  stage2Wrapper.classList.toggle("fade-in");

  // Add the gigachad music
  document.getElementById("stage-2").innerHTML += `<audio src="assets/mp3/gigachadmusic.mp3" id="gigachadaudio" autoplay>
<p>If you are reading this, it is because your browser does not support the audio element.</p>
</audio>`
  const audio = document.getElementById("gigachadaudio");
  audio.volume = 0.3;

  // If the user wants to find another country's Discord server, we'll add the event listener now (since you cannot do it earlier)
  document.getElementsByClassName("not-your-country-button")[0].addEventListener("click", async () => {
    const notYourCountryBtn = document.getElementsByClassName("not-your-country-button")[0];
    notYourCountryBtn.style.display = "none";

    const countrySearch = document.getElementsByClassName("country-search")[0];
    countrySearch.style.display = "flex";
  });
});

// This function basically sets the current country on the stage 2 page.
async function setCurrentCountry(name, countryCode, inviteURL, newCountrySelected) {
  const joinBtn = document.getElementsByClassName('join-button')[0];

  const countryName = document.querySelector('.country-name');
  countryName.innerText = name;

  const flagImg = document.querySelector('.flag-img');
  flagImg.src = `https://flagcdn.com/${countryCode}.svg`;

  // Set it up
  joinBtn.setAttribute('onclick', `openURL("${inviteURL}")`);
  joinBtn.innerText = `Join your brothers!`;

  // This is for if the user clicks one of the countries on "Not your true country?"
  // It just auto-hides the dialog and displays that button again
  if (newCountrySelected) {
    const notYourCountryBtn = document.getElementsByClassName("not-your-country-button")[0];
    notYourCountryBtn.style.display = "";

    const countrySearch = document.getElementsByClassName("country-search")[0];
    countrySearch.style.display = "none";
  }
}

// This is a hacky auto-complete function I cobbled together using StackOverflow.
// Thanks: https://stackoverflow.com/a/38750895

function autocompleteMatch(input) {
  if (input === '') return [];

  const reg = new RegExp(input)

  const filtered = Object.keys(serverList)
  .filter((term) => term.match(reg))
  .reduce((obj, key) => {
    obj[key] = serverList[key];
    return obj;
  }, {});

  return filtered;
}

// This function is called every time the user pops a key into the "Enter your country" search box
function populateServerList(input) {
  const countryList = document.getElementById("countryList")
  
  try {

    // We'll run their input and try and find a match in the array of servers
    let terms = autocompleteMatch(input);

    // Split the keys/values into seperate arrays so it's less of a pain to iterate
    const keys = Object.keys(terms);
    const values = Object.values(terms);

    // Clear the existing country list
    countryList.replaceChildren();


    // If the match has been run against the server list, then..
    if (terms) {

      // If there actually is a few matches..
      if (keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
          const server = values[i];
          // Add the matches to the list
          countryList.insertAdjacentHTML('beforeend', `
        <button class="country-btn" onclick='setCurrentCountry("${server.country}", "${server.cc}", "${server.invite}", true)'>
            <img class="country-btn-img" src="https://flagcdn.com/${server.cc}.svg"/>
            <span class="country-btn-name">${server.country}</span>
        </button>
        `)
        }
      } else {
        // If not.. encourage them to use their "FREEDOM" to create a server
        countryList.insertAdjacentHTML('beforeend', `
        <button class="country-btn" onclick=''>
            <img class="country-btn-img" src="https://flagcdn.com/us.svg"/>
            <span class="country-btn-name">No brotherhood has been found for your country. Make one, and lead it, brother.</span>
        </button>
        `)
      }
    } else {
      // There is no way a user should be able to get this error, but just in case..
      countryList.append(`
        <button class="country-btn">
            <span class="country-btn-name">An error occurred. Reload, brother.</span>
        </button>
        `)
    }
  } catch (e) {
    console.log(e);
  }
}

// Bog standard sleep function.
// My go-to, thanks! https://stackoverflow.com/a/39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// A nice function that we can use for the buttons, to open the Discord server invite URLs in the same tab.
function openURL(url) {
  window.open(url, '_self');
}

// It kindof works.
// Thanks: https://markmichon.com/automatic-retries-with-fetch
const fetchPlus = (url, options = {}, retries) =>
  fetch(url, options)
    .then(res => {
      if (res.ok) {
        return res.json()
      }
      if (retries > 0) {
        return fetchPlus(url, options, retries - 1)
      }
      throw new Error(res.status)
    })
    .catch(error => console.error(error.message))
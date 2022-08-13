// Whew, this JS is a bit complex. Lemme walk you through it

var serverList = {};

window.addEventListener('load', async () => {
  document.getElementById("audio-player-container").innerHTML += `
  <audio src="assets/mp3/humming.mp3" id="hummingAudio" autoplay loop>
      <p>If you are reading this, it is because your browser does not support the audio element.</p>
  </audio>`
  const hummingAudio = document.getElementById("hummingAudio");
  hummingAudio.volume = 0.5;

    // These CodePens are lifesavers:
  // https://codepen.io/idorenyinudoh/pen/GRjBXER
  // https://codepen.io/shahednasser/pen/XWgbGBN
  const playerButton = document.querySelector('.player-button'),
    audio = document.querySelector('audio'),
    soundButton = document.querySelector('.sound-button'),
    volumeSlider = document.querySelector("#volume-slider"),
    outputContainer = document.querySelector("#volume-output");
  
  // Adds event listeners to mute button & volume slider.
  soundButton.addEventListener('click', (e) => {
    audio.muted = !audio.muted;
    if (audio.muted)
      soundButton.classList.add("muted")
    else
      soundButton.classList.remove("muted");
    const soundButtonImg = document.getElementsByClassName('sound-button-img')[0];
    soundButtonImg.src = audio.muted ? "assets/img/stage1/muted.svg" : "assets/img/stage1/unmuted.svg";
    soundButtonImg.alt = audio.muted ? "Sound muted" : "Sound unmuted";
  });
  
  volumeSlider.addEventListener('input', (e) => {
      const value = e.target.value;
  
      outputContainer.textContent = value;
      audio.volume = value / 100;
  });
});

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

document.getElementsByClassName("find-home-button")[0].addEventListener("click", async () => {
  // We'll first change the text of the find home button
  const findHomeBtn = document.getElementsByClassName("find-home-button")[0];
  findHomeBtn.textContent = "Finding your brotherhood.."

  // ..Then we'll change the globe gif to a faster one, both to tell the user something is happening
  const globeImg = document.getElementsByClassName("globe")[0];
  globeImg.src = "assets/img/stage1/Rotating_earth_animated_transparent_fast.webp"

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

  // Remove the current background audio element
  const hummingAudio = document.getElementById("hummingAudio");
  hummingAudio.remove();

  // Once that's done, fade in the new stage 2 wrapper.
  const stage2Wrapper = document.getElementById("stage-2");
  stage2Wrapper.style.display = "block";
  stage2Wrapper.classList.toggle("fade-in");

  // Add the gigachad music, using settings from volume control
  document.getElementById("stage-2").innerHTML += `<audio src="assets/mp3/gigachadmusic.mp3" id="gigachadaudio" autoplay>
<p>If you are reading this, it is because your browser does not support the audio element.</p>
</audio>`
  const audio = document.getElementById("gigachadaudio");
  const soundButton = document.getElementsByClassName("sound-button")[0];
  const volumeSlider = document.getElementById("volume-slider");

  audio.volume = (volumeSlider.value / 100);

  if (soundButton.classList.contains("muted")) {
    audio.muted = true;
  }

  // If the user wants to find another country's Discord server, we'll add the event listener now (since you cannot do it earlier)
  document.getElementsByClassName("not-your-country-button")[0].addEventListener("click", async () => {
    // Clear value of search box & the list to make it less annoying to search again
    const countrySearchBox = document.getElementsByClassName("country-input")[0];
    countrySearchBox.value = "";

    const countryList = document.getElementById("countryList")
    countryList.replaceChildren();

    // Hide button, show input box & list

    const notYourCountryBtn = document.getElementsByClassName("not-your-country-button")[0];
    notYourCountryBtn.style.display = "none";

    const countrySearch = document.getElementsByClassName("country-search")[0];
    countrySearch.style.display = "flex";

    document.getElementsByClassName("country-input")[0].focus();
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

  const lowercase = input.toLowerCase();
  const reg = new RegExp(lowercase);

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
      } else if (keys.length === 0 && input !== '') {
        // If not.. encourage them to use their "FREEDOM" to create a server
        countryList.insertAdjacentHTML('beforeend', `
        <button class="country-btn" onclick='window.location.href="#open-modal"'>
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
/*eslint-env browser*/

const helpers = new Helpers();
const apis = new APIs();
const MAX_CELLS_DISPLAYED = 5;



async function init() {
    const mlbStats = await apis.getMLBStats(); 
    const overviewData = helpers.parseDataForOverview(mlbStats)
    const userInterface = new UserInterface();
    const remoteController = new RemoteController(userInterface, overviewData);
}

function UserInterface() {
    
    const root = document.getElementById('root');
    root.focus();
    
    const overviewCell = (item) => {
        
        const {headline, blurb, image} = item;
        const {title, altText, cuts} = image;
        
        return (
        `<li class='overview-cell'>
            <p class='headline'>${headline}</p>
            <img src=${cuts[6].src} title=${title} alt=${altText}/>
            <p class='blurb'>${blurb}</p>
        </li>`
        )
    }
    
    const setOverviewListView = (data, start, end) => {
        
        let listItems = "";
        for(let i = start; i < end; i++) {
            listItems += overviewCell(data[i]);
        }
        if(getOverviewListView()) {
           getOverviewListView().innerHTML = listItems; 
        }
        else {
            root.innerHTML = `<div class='overview-container'><ul id='overview-listview'>${listItems}</ul></div>`
        }
        
    }
    
    const getOverviewListView = () => {
        return document.getElementById('overview-listview');
    }
    
    
    return {
        setOverviewListView,
        getOverviewListView,
    }
    
}

function RemoteController(userInterface, data) {
    const state = {
        currentIndex: 0
    };

    userInterface.setOverviewListView(data, 0, MAX_CELLS_DISPLAYED);
    userInterface.getOverviewListView().childNodes[state.currentIndex % MAX_CELLS_DISPLAYED].classList.add('highlighted');
    
    document.getElementById('root').addEventListener('keydown', (event) => {
        const {keyCode} = event;
        
        if(keyCode === 37 || keyCode === 39) {
            let {currentIndex} = state;

            userInterface.getOverviewListView().childNodes[currentIndex % MAX_CELLS_DISPLAYED].classList.remove('highlighted');
            if(keyCode === 37) {
                currentIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
                if(currentIndex >= 0) {
                    scrollLeft(userInterface, currentIndex);
                }
            }
            else {
                currentIndex = currentIndex < data.length - 1 ? currentIndex + 1 : currentIndex;
                if(currentIndex <= data.length - 1) {
                    scrollRight(userInterface, currentIndex);
                }
            }
            state.currentIndex = currentIndex;
        }
        
        
    }, true);
    
    const scrollLeft = (userInterface, currentIndex) => {
        if((currentIndex + 1) % MAX_CELLS_DISPLAYED === 0 && currentIndex > 0) {
            userInterface.setOverviewListView(data, currentIndex + 1 - MAX_CELLS_DISPLAYED, currentIndex + 1);
        }
        userInterface.getOverviewListView().childNodes[currentIndex % MAX_CELLS_DISPLAYED].classList.add('highlighted');
    }
    
    const scrollRight = (userInterface, currentIndex) => {
        if(currentIndex % MAX_CELLS_DISPLAYED === 0 && currentIndex < data.length - 1) {
            userInterface.setOverviewListView(data, currentIndex, currentIndex + MAX_CELLS_DISPLAYED);
        }
        userInterface.getOverviewListView().childNodes[currentIndex % MAX_CELLS_DISPLAYED].classList.add('highlighted');
    }
}

function APIs() {
    async function getMLBStats() {
        const response = await fetch('http://statsapi.mlb.com/api/v1/schedule?hydrate=game(content(editorial(recap))),decisions&date=2018-06-10&sportId=1');
        const stats = await response.json();
        return stats;
    }   
    return {
        getMLBStats
    }
}

function Helpers() {
    const parseDataForOverview = (data) => {
        console.log(data)
        const {dates=[]} = data;
        const {games=[]} = dates[0];
        
        const overview = games.reduce((acc, game) => {
            const {content={}} = game;
            const {editorial={}} = content;
            const {recap={}} = editorial;
            const {mlb={}} = recap;
            const {headline="", blurb="", image={}} = mlb;
            acc.push({
                headline,
                blurb,
                image
            });
            return acc;
        }, []);
        
        return overview;
    }
    
    return {
        parseDataForOverview
    }
}

init();
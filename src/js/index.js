import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import {elements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

/**
 * GLOBAL STATE OF THE APP
 * Search state
 * Recipe state
 * like state
 * shopping list state
 */
const state = {};
window.state = state;


/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    //1). Get Query from view
    const query = searchView.getInput();
    
    if (query){
        //2) New search object and add to state
        state.search = new Search(query);

        //3) Prepare UI for Results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            //4). Search for Recipes
            await state.search.getResults();

            //5). Render Results on  the UI
            clearLoader();
            searchView.renderResult(state.search.results);
            //console.log(state.search.results)
        }catch(err){
            alert('Something went wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn =  e.target.closest('.btn-inline');
    if (btn){
        const gotoPage = parseInt(btn.dataset.goto);
        searchView.clearResults();
        searchView.renderResult(state.search.results, gotoPage);
        //console.log(gotoPage);
    }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    const id = window.location.hash.replace('#','');
    //console.log(id);

    if (id){
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected
        if (state.search) searchView.highlightSelected(id);

        //create new recipe Object
        state.recipe = new Recipe(id);

        try{ 
            //get Reecipe Data and parse Ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate Servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render Recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        }catch(err){
            alert('Error! Processing Recipe');
        }

    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
    //create a new list if there is none
    if (!state.list) state.list = new List();

    // add each element to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItems(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};


//Handle delete and update list event items
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete from the state
        state.list.deleteItems(id);

        //delete from the UI
        listView.deleteItems(id);

    //Handle the count update
    }else if (e.target.matches('.shopping__count-value')){
        const value = parseFloat(e.target.value, 10);
        state.list.updateCount(id, value);
    }
});

/**
 * LIKES CONTROLLER
 */

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)){
        //Add likes to the state
        const newLike = state.likes.addLikes(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.image
        );

        //Toggle the likes button
        likesView.toggleLikeBtn(true);

        //Add likes to the UI list
        likesView.renderLike(newLike);
        console.log(state.likes);

    //User has liked current recipe
    }else {
        //Remove likes from the state
        state.likes.deleteLikes(currentID);

        //Toggle the likes button
        likesView.toggleLikeBtn(false);


        //Remove likes from the UI list
        likesView.deleteLike(currentID);
        console.log(state.likes);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //console.log(state.likes.getNumLikes());
};

//restore liked items on page reload
window.addEventListener('load', () => {
    state.likes = new Likes();

    state.likes.readStorage();

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-dec, .btn-dec *')){
        //Decrease button is clicked
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.btn-inc, .btn-inc *')) {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')){
        //Add Ingredients to shopping list
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        //call the like controller
        controlLike();
    }
});


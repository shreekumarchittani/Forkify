import Search from './models/Search';
import Recipe from './models/Recipe'
import Likes from './models/Likes'
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './views/base';
import List from './models/List';
/**  Global state of the app
 * - Search object
 * - Current Recipe object
 * - Shopping list object
 * - Liked Recipes
 */

const state = {};

/**
 * SEARCH CONTROLLER
 */
const constrolSearch = async ()=>{
    // 1. Get Query from view
    const query = searchView.getInput();
    //console.log(query);

    if (query){
        //2. New search object and add to state
        state.search = new Search(query);

        //3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //4. search for recipes
            await state.search.getResults();

            //5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result,);
        } catch (error) {
            alert('Something wrong with the search...');
            clearLoader();
        }
        

    }
};

elements.searchForm.addEventListener('submit',e =>{
    e.preventDefault();
    constrolSearch();
});


elements.searchResPages.addEventListener('click', e =>{
    
    const btn = e.target.closest('.btn-inline');
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result,goToPage);
    }
});



/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () =>{
    //Get ID from URL
    const id = window.location.hash.replace('#','');

    if (id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight the selected search item
        if (state.search) searchView.highlightSelected(id);

        // Create new Reciipe object
        state.recipe = new Recipe(id);
        try{
            //Get Recipe data and parse Ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calculate serving and time
            state.recipe.calcServings();
            state.recipe.calcTime();

            // Render the recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch(error){
            alert('error processing recipe');
        }
        
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 *  LIST CONTROLLER
 */
const controlList = ()=> {
    // Create a new liist if there is none yet
    if (!state.list) state.list = new List()

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);

    });
    // Delete Button Enabling
    listView.DeleteButtonHadnler(state.list.items);
};

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

        // Checking to disable Delete List button
        listView.DeleteButtonHadnler(state.list.items);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKE CONTROLLER
 *///TESTIING

const controlLike = () =>{
    if (!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id;

    // User has NOT liked current recipe
    if (!state.likes.isLiked(currentId)){
        // Add like to the state 
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img    
        );
        // Toggle the like button
        likesView.toggleLikeButton(true);


        // Add like to UI list 
        likesView.renderLike(newLike);  

    // User HAS liked current recipe
    } else {
        // Remove like from the state 
        state.likes.deleteLike(currentId);


        // Toggle the like button
        likesView.toggleLikeButton(false);

        // Remove like from UI list 
        likesView.deleteLike(currentId);   
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //state.likes.getNumLikes();
};

// Restore liked recipes on page load
window.addEventListener('load', () =>{
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));

    // Hide Delete list items button
    elements.delList.style.visibility = 'hidden';

});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e =>{
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    } else if (e.target.matches('.btn-increase, .btn-increase *')){
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')){
        // Like controller
        controlLike();
    }
});

// Handling Delete all List Items button clicks
elements.shoppingParent.addEventListener('click', e=>{
    if (e.target.matches('.delete__items--list, .delete__items--list *')){
        // Delete all the items from the list
        state.list = new List();

        // Make the list empty in UI
        elements.shopping.innerHTML ='';

        // Make Delete all List button hidden
        listView.DeleteButtonHadnler(state.list.items);
    }
});

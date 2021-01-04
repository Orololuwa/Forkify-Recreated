import axios from 'axios';

export default class Recipe{
    constructor(id){
        this.id  = id;

    }

    async getRecipe() {
        try{
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.image = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
        }catch(error){
            console.log(error)
            alert('Something went wrong!');
        }
    }

    calcTime(){
        //Assuming we need 15 minutes for each 3 ingredients
        const numIng = this.ingredients.length;
        const period = Math.ceil(numIng / 3);
        this.time = period * 15;
    }

    calcServings(){
        this.servings = 4;
    }

    parseIngredients(){
        const unitLong = ['tablespoons', 'tablespoon', 'teaspoons', 'teaspoon', 'ounces', 'ounce', 'cups', 'pounds'];
        const unitShort = ['tbsp', 'tbsp', 'tsp', 'tsp', 'oz', 'oz', 'cup', 'pounds'];
        const units = [...unitShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            //new units
            let ingredient = el.toLowerCase();
            unitLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitShort[i]);
            });

            //Remove parenthesis
            ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

            //parse ingredients into count, units and ingredients
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;
            if (unitIndex > -1){
                //There is a unit
                let arrCount = arrIng.slice(0, unitIndex);
                let count;

                if (arrCount.length === 1 ){
                    //grab the first index
                    count = eval(arrIng[0].replace("-","+"));
                }else{
                    // grab the whole fraction
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                }

                objIng = {
                    count, 
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                }
            }else if(parseInt(arrIng[0], 10)){
                //There is NO unit but the first index is a number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ')
                }
            }else if(unitIndex === -1){
                //There is No unit
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                };
            }
            return objIng;
        })
        this.ingredients = newIngredients;
    };
    
    updateServings(type) {
        //servings
        const newServings = type === 'dec'? this.servings - 1: this.servings + 1;

        //Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }
}
import axios from 'axios';


export default class Search{
    constructor(query){
        this.query = query;
    }
    async getResults(){
        try{
            //console.log(this.query);
            const url = `https://forkify-api.herokuapp.com/api/search?q=${this.query}`;
            //console.log(url);
            const res = await axios(url);
            this.result = res.data.recipes;
            //console.log(this.result);
        }catch(e){
            alert(e);
        }
    
    };

}




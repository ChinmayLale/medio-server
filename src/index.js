import 'dotenv/config'
import ConnectDB from './DB/index.js'
import { app } from './app.js';






ConnectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server Is Running On Port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{console.log(`MongoDB Connection Failed !! : ${err}`);
})
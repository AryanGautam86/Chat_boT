// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://127.0.0.1:8000",
// });

// export default API;
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.PROD
    ? ""
    : "http://127.0.0.1:8000",
});

export default API;
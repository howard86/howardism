import { combineReducers } from "redux";
import auth from "./slices/auth";

const reducer = combineReducers({ auth });

export default reducer;

import { type ChangeEvent, useReducer } from "react";

import {
  type SearchUsersLazyQueryHookResult,
  useSearchUsersLazyQuery,
} from "@/generated/graphql";

interface SearchState {
  username: string;
}

interface UseSearch {
  onSearch: () => void;
  onType: (event: ChangeEvent<HTMLInputElement>) => void;
  result: SearchUsersLazyQueryHookResult[1];
  state: SearchState;
}

interface SearchAction {
  payload: string;
  type: "updateUsername";
}

const INITIAL_USERNAME = "";
const DEFAULT_COUNT = 10;

const initialState: SearchState = {
  username: INITIAL_USERNAME,
};

const reducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case "updateUsername":
      return { ...state, username: action.payload };

    default:
      throw new Error("missing action type");
  }
};

const useSearch = (count = DEFAULT_COUNT): UseSearch => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [search, result] = useSearchUsersLazyQuery();

  const onType = (event: ChangeEvent<HTMLInputElement>): void => {
    dispatch({ type: "updateUsername", payload: event.target.value });
  };

  const onSearch = (): void => {
    search({ variables: { query: `${state.username} in:login`, count } });
  };

  return {
    state,
    result,
    onType,
    onSearch,
  };
};

export default useSearch;

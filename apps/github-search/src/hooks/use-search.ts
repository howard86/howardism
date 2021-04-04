import { ChangeEvent, useReducer } from "react";
import { SearchUsersLazyQueryHookResult, useSearchUsersLazyQuery } from "@/generated/graphql";

interface SearchState {
  username: string;
}

interface UseSearch {
  state: SearchState;
  result: SearchUsersLazyQueryHookResult[1];
  onType: (event: ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
}

type SearchAction = { type: "updateUsername"; payload: string };

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
      break;
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

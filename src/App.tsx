import { useEffect, useReducer, useMemo, useCallback, useState } from 'react';
import { sortFilesBySelection, getFileExtensions } from './utils';
import { fetchAllFiles, fetchBranches } from './api';
import {
  RepositoryInput,
  Result,
  Branches,
  Loading,
  NoRepositorySelected,
  FileList,
  LastCommit,
  FileFilter,
  Header,
} from './components';
import { reducer, initialState } from './stateReducer';
import { GithubBranch } from './types';

function App() {
  const [lastSuccessfulFetchedData, setLastSuccessfulFetchedData] = useState<
    GithubBranch[] | null
  >(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    files,
    repo,
    isLoadingRepoFiles,
    selectedBranch,
    branches,
    isLoadingFileContents,
    selectedExtensions,
    searchQuery,
    fileExtensions,
  } = state;

  const handleRepoSubmit = useCallback(
    async (repo: string) => {
      try {
        const branches = await fetchBranches(repo).then((branches) =>
          branches.sort((a, b) => {
            // Sorting branches so that 'main' or 'master' always comes first
            if (a.name === 'main' || a.name === 'master') return -1;
            if (b.name === 'main' || b.name === 'master') return 1;
            return a.name.localeCompare(b.name);
          })
        );

        if (
          JSON.stringify(lastSuccessfulFetchedData) !== JSON.stringify(branches)
        ) {
          dispatch({ type: 'SET_BRANCHES', payload: branches });
          dispatch({ type: 'SET_SELECTED_BRANCH', payload: selectedBranch ? selectedBranch : branches[0].name });
          dispatch({ type: 'SET_REPO', payload: repo });
          setLastSuccessfulFetchedData(branches);
        }
      } catch (error) {
        alert('Failed to fetch repository branches');
        // test
      }
    },
    [lastSuccessfulFetchedData, selectedBranch]
  );

  useEffect(() => {
    if (repo) {
      const interval = setInterval(async () => {
        await handleRepoSubmit(repo);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [handleRepoSubmit, repo]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (repo) {
        dispatch({ type: 'SET_IS_LOADING_REPO_FILES', payload: true });
        try {
          const files = await fetchAllFiles(repo, selectedBranch);
          const fileExtensions = getFileExtensions(files);

          if (!isCancelled) {
            dispatch({ type: 'SET_FILES', payload: files });
            dispatch({ type: 'SET_IS_LOADING_REPO_FILES', payload: false });
            dispatch({ type: 'SET_FILE_EXTENSIONS', payload: fileExtensions });
          }
        } catch (error) {
          console.error('Failed to fetch data', error);
          dispatch({ type: 'SET_IS_LOADING_REPO_FILES', payload: false });
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
      dispatch({ type: 'SET_IS_LOADING_REPO_FILES', payload: false });
    };
  }, [repo, selectedBranch, lastSuccessfulFetchedData]);

  const handleSelection = useCallback((path: string) => {
    dispatch({ type: 'TOGGLE_SELECT_FILE', payload: path });
  }, []);

  const handleFileCollapse = useCallback((path: string) => {
    dispatch({ type: 'TOGGLE_CONTENT_COLLAPSE', payload: path });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleBranchSelect = useCallback((branch: string) => {
    dispatch({ type: 'SET_SELECTED_BRANCH', payload: branch });
  }, []);

  const handleSelectFileExtension = useCallback(
    (extension: string) => {
      if (selectedExtensions.includes(extension)) {
        dispatch({
          type: 'SET_SELECTED_FILE_EXTENSION',
          payload: selectedExtensions.filter((ext) => ext !== extension),
        });
      } else {
        dispatch({
          type: 'SET_SELECTED_FILE_EXTENSION',
          payload: [...selectedExtensions, extension],
        });
      }
    },
    [selectedExtensions]
  );

  const handleSearchQuery = useCallback((extension: string) => {
    dispatch({
      type: 'SET_SEARCH_QUERY',
      payload: extension,
    });
  }, []);

  const handleClear = useCallback(() => {
    dispatch({
      type: 'SET_SELECTED_FILE_EXTENSION',
      payload: [],
    });
    dispatch({
      type: 'SET_SEARCH_QUERY',
      payload: '',
    });
  }, []);

  const handleClearFiles = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_FILES' });
  }, []);

  const setContentsLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_IS_LOADING_FILE_CONTENTS', payload: isLoading });
  }, []);

  const selectedBranchItem = branches.find(
    (branch) => branch.name === selectedBranch
  );

  const displayedFiles = useMemo(() => {
    let filesToDisplay = files;

    if (selectedExtensions.length > 0) {
      filesToDisplay = files.filter((file) =>
        selectedExtensions.some((ext) => file.path.endsWith(`.${ext}`))
      );
    }

    return sortFilesBySelection(filesToDisplay).filter((file) =>
      file.path
        .toLowerCase()
        .includes(searchQuery ? searchQuery.toLowerCase() : '')
    );
  }, [files, selectedExtensions, searchQuery]);

  const selectedFiles = useMemo(() => {
    return files.filter((file) => file.isSelected);
  }, [files]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-4">
        <div className="container mx-auto">
          <div>
            <RepositoryInput
              onSubmit={handleRepoSubmit}
              onReset={handleReset}
            />
            {repo && (
              <Branches
                branches={branches}
                selectedBranch={selectedBranch}
                handleBranchSelect={handleBranchSelect}
              />
            )}
            {selectedBranchItem && (
              <>
                <LastCommit
                  commit={selectedBranchItem.lastCommit}
                  repo={repo}
                />
                <FileFilter
                  value={searchQuery}
                  onChange={handleSearchQuery}
                  selectedExtensions={selectedExtensions}
                  onSelectExtension={handleSelectFileExtension}
                  extensions={fileExtensions}
                  onClear={handleClear}
                />
              </>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                {isLoadingRepoFiles ? (
                  <Loading />
                ) : repo ? (
                  <FileList
                    files={displayedFiles}
                    handleSelection={handleSelection}
                  />
                ) : (
                  <NoRepositorySelected />
                )}
              </div>
              {repo && (
                <div className="md:col-span-2 min-h-[100vh]">
                  <div className="bg-white shadow p-6 rounded min-h-full">
                    <Result
                      files={selectedFiles}
                      repo={repo}
                      branch={selectedBranch}
                      isLoadingFileContents={isLoadingFileContents}
                      handleClearFiles={handleClearFiles}
                      setContentsLoading={setContentsLoading}
                      handleFileCollapse={handleFileCollapse}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

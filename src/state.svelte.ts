import { loop } from "./algorithm";

function createState<T>(initialValue: T) {
  let state = $state(initialValue);
  function setState(newValue: T) {
    state = newValue;
  }
  return {
    get state() {
      return state;
    },
    setState,
  };
}

type ComponentList = "Dashboard" | "Schedulable Loads" | "Simulation" | "Household" | "Stop";

const componentState = createState<ComponentList>("Dashboard");
const dashboardState = createState<boolean>(false);

// @ts-ignore
const stepperDataState = createState<StepperData>({});

const efficiencyResultsState = createState<EfficiencyResult[]>([]);

const runtimeState = createState<number | null>(null);
const runtimeIntervalState = createState<number | null>(null);
const runtimeStartTimeState = createState<number | null>(null);

const householdState = createState<Household | null>(null);

const startDateState = createState<number>(0);
const endDateState = createState<number>(0);

const loopState = createState<"idle" | "running" | "completed">("idle");
const loopIntervalState = createState<number | null>(null);

export function getStartDate() {
  function setStartDate(date: number) {
    startDateState.setState(date);
  }
  return {
    get startDate() {
      return startDateState.state;
    },
    setStartDate,
  };
}

export function getEndDate() {
  function setEndDate(date: number) {
    endDateState.setState(date);
  }
  return {
    get endDate() {
      return endDateState.state;
    },
    setEndDate,
  };
}

export function getHousehold() {
  function setHousehold(household: Household | null) {
    householdState.setState(household);
  }
  return {
    get household() {
      return householdState.state;
    },
    setHousehold,
  };
}

export function getComponent() {
  function setComponent(component: ComponentList) {
    componentState.setState(component);
  }

  return {
    get currentComponent() {
      return componentState.state;
    },
    setComponent,
  };
}

export function getDashboard() {
  function setDashboard(state: boolean) {
    dashboardState.setState(state);
  }
  return {
    get startDashboard() {
      return dashboardState.state;
    },
    setDashboard,
  };
}

export function getStepperData() {
  function setStepperData(data: StepperData) {
    stepperDataState.setState(data);
  }
  return {
    get stepperData() {
      return stepperDataState.state;
    },
    setStepperData,
  };
}

export function getEfficiencyResults() {
  function setEfficiencyResults(results: EfficiencyResult[]) {
    efficiencyResultsState.setState(results);
  }
  return {
    get efficiencyResults() {
      return efficiencyResultsState.state;
    },
    setEfficiencyResults,
  };
}

export function getRuntime() {
  /**
   * Starts the runtime timer.
   * If the timer is already running, it won't start another one.
   */
  function startRuntime() {
    if (runtimeIntervalState.state === null) {
      // Prevent multiple intervals
      runtimeStartTimeState.setState(Date.now());
      runtimeIntervalState.setState(
        window.setInterval(() => {
          if (runtimeStartTimeState.state !== null) {
            const elapsed = Date.now() - runtimeStartTimeState.state; // Elapsed time in milliseconds
            runtimeState.setState(parseFloat((elapsed / 1000).toFixed(2))); // Convert to seconds with two decimals
          }
        }, 100) // Update every 100ms for two decimal precision
      );
    }
  }

  /**
   * Stops the runtime timer.
   * Resets the runtime state and clears the interval.
   */
  function stopRuntime() {
    if (runtimeIntervalState.state !== null) {
      clearInterval(runtimeIntervalState.state);
      runtimeIntervalState.setState(null);
      runtimeStartTimeState.setState(null);
    }
  }

  /**
   * Resets the runtime timer.
   * Stops the current timer and starts it again.
   */
  function resetRuntime() {
    stopRuntime();
    startRuntime();
  }

  return {
    get runtime() {
      return runtimeState.state;
    },
    startRuntime,
    stopRuntime,
    resetRuntime,
  };
}

export function getLoopManager() {
  let onCompleteCallback: (() => void) | null = null;
  let currentOffset = 0;

  /**
   * Starts the loop process.
   * Ensures only one loop runs at a time.
   */
  function startLoop(onComplete?: () => void) {
    if (loopIntervalState.state !== null) {
      console.warn("Loop is already running.");
      return;
    }

    if (onComplete) {
      onCompleteCallback = onComplete;
    }

    const stepperData = getStepperData();
    const efficiencyResults = getEfficiencyResults();
    const startDate = getStartDate();
    const endDate = getEndDate();

    loopState.setState("running");
    currentOffset = 0;

    function executeLoop(offset: number): boolean {
      const results = loop(
        stepperData.stepperData.energyflow,
        stepperData.stepperData.twinworld.households,
        stepperData.stepperData.costmodel,
        stepperData.stepperData.algo,
        offset
      );

      if (startDate.startDate === 0) {
        startDate.setStartDate(results.totalStartDate);
      }

      if (endDate.endDate === 0) {
        endDate.setEndDate(results.endDate);
      }

      const transformedResults = results.results.map((resultArray) => ({
        solarEnergyIndividual: resultArray[0],
        solarEnergyTotal: resultArray[1],
        internalBoughtEnergyPrice: resultArray[2],
        totalAmountSaved: resultArray[3],
      }));

      efficiencyResults.setEfficiencyResults([
        ...efficiencyResults.efficiencyResults,
        ...transformedResults,
      ]);

      // Stop the loop if results are empty
      if (results.results.length === 0 && results.totalStartDate === 0 && results.endDate === 0) {
        return false;
      }

      currentOffset += 7;
      return true;
    }

    // Start the interval
    loopIntervalState.setState(
      window.setInterval(() => {
        const shouldContinue = executeLoop(currentOffset);

        if (!shouldContinue) {
          stopLoop();
          if (onCompleteCallback) {
            onCompleteCallback(); // Notify when done
          }
        }
      }, 100)
    );
  }

  /**
   * Stops the loop process.
   * Resets state and clears the interval.
   */
  function stopLoop() {
    if (loopIntervalState.state !== null) {
      clearInterval(loopIntervalState.state);
      loopIntervalState.setState(null);
      loopState.setState("completed");
    }
  }

  return {
    get state(): "idle" | "running" | "completed" {
      return loopState.state;
    },
    startLoop,
    stopLoop,
  };
}

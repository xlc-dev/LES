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

const componentState = createState<ComponentList>("Dashboard");
const dashboardState = createState<boolean>(false);
const stepperDataState = createState<StepperData | null>(null);

const efficiencyResultsState = createState<EfficiencyResult[]>([]);
const timeDailiesState = createState<ApplianceTimeDaily[]>([]);

const runtimeState = createState<number | null>(null);
const runtimeIntervalState = createState<number | null>(null);
const runtimeStartTimeState = createState<number | null>(null);

const householdState = createState<Household | null>(null);

const startDateState = createState<number>(0);
const endDateState = createState<number>(0);
const daysInPlanningState = createState<number>(0);

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

export function getDaysInPlanning() {
  function setDaysInPlanning(days: number) {
    daysInPlanningState.setState(days);
  }
  return {
    get daysInPlanning() {
      return daysInPlanningState.state;
    },
    setDaysInPlanning,
  };
}

export function getHousehold() {
  function setHousehold(household: Household) {
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

export function getTimeDailies() {
  function setTimeDailies(data: ApplianceTimeDaily[]) {
    timeDailiesState.setState(data);
  }
  return {
    get timeDailies() {
      return timeDailiesState.state;
    },
    setTimeDailies,
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

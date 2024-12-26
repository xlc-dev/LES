onmessage = function(e) {
  const { stepperData, offset } = e.data;

  const results = loop(
    stepperData.energyflow,
    stepperData.twinworld.households,
    stepperData.costmodel,
    stepperData.algo,
    offset
  );

  const transformedResults = results.results.map((resultArray) => ({
    solarEnergyIndividual: resultArray[0],
    solarEnergyTotal: resultArray[1],
    internalBoughtEnergyPrice: resultArray[2],
    totalAmountSaved: resultArray[3],
  }));

  postMessage({
    totalStartDate: results.totalStartDate,
    endDate: results.endDate,
    daysInPlanning: results.daysInPlanning,
    timeDaily: results.timeDaily,
    transformedResults,
    nextOffset: offset + 7,
  });
};

class DataManager {
  constructor(year) {
    this.year = year;
    this.datasets = [];
  }

  addDataset(yearTrack) {
    if (!this.datasets.some(x => x.name == yearTrack.name))
    {
        this.datasets.push(yearTrack);
        return "";
    }
    else
    {
        return "ERROR MESSAGE: Year track with that name already exists.";
    }
  }
}
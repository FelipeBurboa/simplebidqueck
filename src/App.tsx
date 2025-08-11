import { useState, useEffect } from "react";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";

type PlotList = {
  name: string;
  plots: string[];
};

type Quantities = Record<string, string>;
type Pinned = Record<string, boolean>;

export default function App() {
  const [lists, setLists] = useState<PlotList[]>(() => {
    const saved = localStorage.getItem("lists");
    return saved ? JSON.parse(saved) : [];
  });

  const [quantities, setQuantities] = useState<Quantities>(() => {
    const saved = localStorage.getItem("quantities");
    return saved ? JSON.parse(saved) : {};
  });

  const [pinned, setPinned] = useState<Pinned>(() => {
    const saved = localStorage.getItem("pinned");
    return saved ? JSON.parse(saved) : {};
  });

  const [listName, setListName] = useState("");
  const [plotInput, setPlotInput] = useState("");
  const [selectedList, setSelectedList] = useState<string | null>(() => {
    const savedLists = localStorage.getItem("lists");
    if (savedLists) {
      const parsed = JSON.parse(savedLists);
      return parsed.length > 0 ? parsed[0].name : null;
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem("lists", JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem("quantities", JSON.stringify(quantities));
  }, [quantities]);

  useEffect(() => {
    localStorage.setItem("pinned", JSON.stringify(pinned));
  }, [pinned]);

  const handleChange = (plot: string, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [plot]: value,
    }));
  };

  const handleTogglePinned = (plot: string) => {
    setPinned((prev) => ({
      ...prev,
      [plot]: !prev[plot],
    }));
  };

  const handleAddList = () => {
    if (!listName.trim() || !plotInput.trim()) return;

    const plots = plotInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.includes("-"));

    if (plots.length === 0) return;

    const newList: PlotList = {
      name: listName.trim(),
      plots,
    };

    setLists((prev) => [...prev, newList]);
    setListName("");
    setPlotInput("");
    setSelectedList(newList.name);
  };

  const handleDeleteList = (name: string) => {
    const updatedLists = lists.filter((list) => list.name !== name);
    setLists(updatedLists);

    if (selectedList === name) {
      setSelectedList(updatedLists.length > 0 ? updatedLists[0].name : null);
    }
  };

  const currentList = lists.find((list) => list.name === selectedList);

  const sortedPlots = currentList
    ? (() => {
        const pinnedPlots = currentList.plots.filter((p) => pinned[p]);
        const unpinnedPlots = currentList.plots
          .filter((p) => !pinned[p])
          .sort((a, b) => {
            const aVal = quantities[a];
            const bVal = quantities[b];

            const aEmpty = aVal === undefined || aVal === "";
            const bEmpty = bVal === undefined || bVal === "";

            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return 1;
            if (bEmpty) return -1;

            return Number(aVal) - Number(bVal);
          });

        return [...pinnedPlots, ...unpinnedPlots];
      })()
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Plot Bid Quantity Tracker
      </h1>

      {/* Add New List Form */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-3">Add New Plot List</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="listName">List Name</Label>
            <Input
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g. My Ward 21 Plots"
            />
          </div>
          <div>
            <Label htmlFor="plots">Plots (comma separated)</Label>
            <Input
              id="plots"
              value={plotInput}
              onChange={(e) => setPlotInput(e.target.value)}
              placeholder="e.g. 21-28, 22-10, 22-11"
            />
          </div>
        </div>
        <Button className="mt-4" onClick={handleAddList}>
          Add List
        </Button>
      </div>

      {/* List Selector */}
      {lists.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {lists.map((list) => (
            <Button
              key={list.name}
              variant={selectedList === list.name ? "default" : "outline"}
              onClick={() => setSelectedList(list.name)}
            >
              {list.name}
            </Button>
          ))}
        </div>
      )}

      {/* Selected List Display */}
      {currentList ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{currentList.name}</h2>
            <Button
              variant="destructive"
              onClick={() => handleDeleteList(currentList.name)}
            >
              Delete
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPlots.map((plot) => {
              const [ward, plotNumber] = plot.split("-");

              return (
                <div
                  key={plot}
                  className={`p-3 rounded border flex flex-col gap-2 ${
                    pinned[plot]
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Ward</p>
                      <p className="text-lg font-semibold">{ward}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Plot</p>
                      <p className="text-lg font-semibold">{plotNumber}</p>
                    </div>
                  </div>

                  {/* Pin Checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`pin-${plot}`}
                      checked={!!pinned[plot]}
                      onCheckedChange={() => handleTogglePinned(plot)}
                    />
                    <Label htmlFor={`pin-${plot}`} className="text-sm">
                      Pin
                    </Label>
                  </div>

                  {/* Bids Input */}
                  <div>
                    <Label htmlFor={plot} className="text-sm">
                      Bids
                    </Label>
                    <Input
                      id={plot}
                      type="number"
                      className="text-lg font-bold placeholder:font-normal placeholder:text-gray-400"
                      min={0}
                      value={quantities[plot] || ""}
                      onChange={(e) => handleChange(plot, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No list selected.</p>
      )}
    </div>
  );
}

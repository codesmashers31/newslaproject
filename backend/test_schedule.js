
const b = { name: "Frontend-Batch 8-10", schedule: "08:00 - 10:00", startTime: "08:00", endTime: "10:00" };
function resolveDomainSchedule(b) {
    if (!b) return "Not Assigned";
    if (b.schedule && b.schedule !== "Schedule Not Set") return b.schedule;
    
    if (b.name) {
      const match = b.name.match(/(\d{1,2})-(\d{1,2})/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        const formatTime = (h) => {
          if (h === 12) return "12:00 PM";
          if (h < 8) return "0" + h + ":00 PM";
          return (h < 10 ? "0" : "") + h + ":00 AM";
        };
        return "Mon - Fri * " + formatTime(start) + " - " + formatTime(end);
      }
    }
    return "Not Assigned";
}
console.log(resolveDomainSchedule(b));


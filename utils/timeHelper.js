let dateFormat = require('dateformat');

module.exports = {
    timespan : function(before, after){
        if (typeof before === 'number')
            before = new Date(before);

        if (typeof after === 'number')
            after = new Date(after);

        let diff = after.getTime() - before.getTime();

        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -=  days * (1000 * 60 * 60 * 24);

        let hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        let mins = Math.floor(diff / (1000 * 60));

        if (days >= 1)
            return days + 'D';
        if (hours >= 1)
            return hours + 'H';

        return mins + 'M';
    },

    remaining : function(before, after){
        if (typeof before === 'number')
            before = new Date(before);

        if (typeof after === 'number')
            after = new Date(after);

        let diff = after.getTime() - before.getTime();

        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -=  days * (1000 * 60 * 60 * 24);

        let hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        let mins = Math.floor(diff / (1000 * 60));

        let string = '';
        if (days > 1)
            string += days + ' days ';
        if (days === 1)
            string += days + ' day ';

        if (hours > 1)
            string += hours + ' hours ';
        if (hours === 1)
            string += hours + ' hour ';

        if (mins > 1)
            string += mins + ' minutes ';
        if (mins === 1)
            string += mins + ' minute ';

        if (days < 1 && mins < 1 && mins < 1)
            string = '< a minute';

        return string;
    },

    // returns formatted date string for the time + minutes.
    // datetime can be date object, or milliseconds
    timePlusMinutes : function(datetime, minutes){
        let time = this.timePlusMinutesAsDate(datetime, minutes);
        return dateFormat(time, 'mmm dS h:MM');
    },

    // adds minutes to a date. date can be a date object or milliseconds (as giveaways are persisted)
    timePlusMinutesAsDate : function(datetime, minutes){
        if (typeof datetime === 'number')
            datetime = new Date(datetime);

        return new Date(datetime.getTime() + minutes * 60000);
    },

    ///
    daysSince : function(datetime){
        if (typeof datetime === 'number')
            datetime = new Date(datetime);

        let elapsed = new Date().getTime() - datetime.getTime();
        return Math.floor(elapsed / (1000 * 60 * 60 * 24)); // convert elapsed to minutes
    },

    // gets a date value of the date x days ago
    daysAgo: function(daysAgo){

        let date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    },

    // gets minutes (integer) since the given time. datetime can be a date object, or milliseconds
    minutesSince : function(datetime){
        if (typeof datetime === 'number')
            datetime = new Date(datetime);

        let elapsed = new Date().getTime() - datetime.getTime();
        return Math.floor(elapsed / (1000 * 60)); // convert elapsed to minutes
    }
} ;

var GridWidget = {
    options : {
        width : "",
        height : "",
        requestURL : "",
        pageSizeDisplay :true,
        selectAllOption : false,
        pageSize : "25",
        page : "1",
        count : "",
        pageSizeOptions : ["10", "25", "50", "100"],
        columnHeaders : {},
        pageNextUrl : "",
        paginationSide : "Server",
        sortField : "",
        sortOrder : "descending",
        pagePreviousUrl : "",
        search : {
                    display : "",
                    URL : "",
                    searchedVal : "",
                 },
        add : {
                    display : "",
                    URL : "",
              },
        header: "",
        addCustomAction : {
                    callback:"",
                    minWidth : 50,
                },
        dataForPagination : {},
        currentQuerySet : {},
        pageSpan:"",
        pageSizeDiv:"",
    },
    // Widget Constructor
    _create : function() {
        var url;
        if (this.options.search.display != "") {
            var searchForm = document.createElement("form");
            searchForm.name = "Search";
            searchForm.method = "GET";
            searchForm.enctype = "multipart/form-data";

            var searchDiv = document.createElement("div");
            searchDiv.setAttribute("class", "search");

            var searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.setAttribute("class", "searchTxtBox");
            searchInput.name = "searchText";
            searchInput.setAttribute("placeholder", "Search");

            var span = document.createElement("span");
            span.setAttribute("class","searchImage");
            span.innerHTML = "&nbsp;&nbsp;";
            span.setAttribute("title", "Search");

            var submitBtn = document.createElement("input");
            submitBtn.setAttribute("type", "submit");
            submitBtn.style.display = "none";

            $(span).click(function(){$(submitBtn).trigger("click")});

            searchDiv.appendChild(span);
            searchDiv.appendChild(searchInput);
            searchDiv.appendChild(submitBtn);
            searchForm.appendChild(searchDiv);
            $(searchForm).submit($.proxy(this._onClickSearch, this));
        }

        if (this.options.header != "") {
            var gridHeader = document.createElement("div");
            gridHeader.setAttribute("class","datagridHeader");
            gridHeader.innerHTML = this.options.header;
            if (this.options.add.display != "") {
                var addDiv = document.createElement("div");
                addDiv.setAttribute("class", "add");

                var addLink = document.createElement('a');
                addLink.setAttribute("href",this.options.add.URL);
                addLink.setAttribute("id", this.options.add.id);
                addLink.setAttribute("title","Add New");

                var addImg = document.createElement('div');
                addImg.setAttribute("class","addImg");
                addDiv.appendChild(addLink);
                addLink.appendChild(addImg);
                 gridHeader.appendChild(addDiv);
            }
        }

        if (this.options.pageSizeDisplay == true ) {
            var pageSizeDiv = document.createElement("div");
            pageSizeDiv.setAttribute("class", "pageSize");
            var pageSizeSelect = document.createElement("select");
            pageSizeSelect.setAttribute("class", "pageValue");
            for (var i = 0; i < this.options.pageSizeOptions.length; i++)
            {
                var pageSizeOption = document.createElement("option");
                pageSizeOption.setAttribute("value", this.options.pageSizeOptions[i]);
                pageSizeOption.innerHTML = this.options.pageSizeOptions[i];
                if (this.options.pageSize == this.options.pageSizeOptions[i]) {
                    pageSizeOption.setAttribute("selected", "true");
                }
                pageSizeSelect.appendChild(pageSizeOption);
            }
            $(pageSizeSelect).bind("change", $.proxy(this._onChangeSelectPageSize, this));
            pageSizeDiv.appendChild(pageSizeSelect);
            this.options.pageSizeDiv = pageSizeDiv;
        }
        var pageSpan = document.createElement("span");
        pageSpan.setAttribute("class", "current");
        this.options.pageSpan = pageSpan;
        var _this = this;

        var paginationDiv = this.createPaginationDiv();
        this.options.paginationDivLower = this.createPaginationDiv();

        this.element.append(searchForm);
        this.element.append(gridHeader);
        this.element.append(paginationDiv);
        if (this.options.paginationSide == "Server") {
                url = _this._getURL();
                this._requestData(url);
        }
    },

    //function to create pagination div
    createPaginationDiv : function()
    {
        var paginationDiv = document.createElement("div");
        paginationDiv.setAttribute("class", "pagination");
        var previousImageBox = document.createElement("div");
        previousImageBox.setAttribute("class", "arrowPrevBox");
        var previousImageSource = document.createElement("a");
        previousImageSource.setAttribute("class", "arrowPrev");
        previousImageSource.setAttribute("href",'#');
        previousImageSource.setAttribute("disabled", "true");

        var currentPage = document.createElement('div');
        currentPage.setAttribute("class", "currentPage")
        $(currentPage).html("1");

        var nextImageBox = document.createElement("div");
        nextImageBox.setAttribute("class", "arrowNextBox");

        var nextImageSource = document.createElement('a');
        nextImageSource.setAttribute('class','arrowNext');
        nextImageSource.setAttribute('href', '#');
        nextImageSource.setAttribute("disabled", "true");

        previousImageBox.appendChild(previousImageSource);
        paginationDiv.appendChild(previousImageBox);
        paginationDiv.appendChild(currentPage);
        nextImageBox.appendChild(nextImageSource);
        paginationDiv.appendChild(nextImageBox);

        var _this = this;
        $(previousImageBox).bind("click", function(event){
            if($(this).find("a").attr("class") == "arrowPrevEnable") {
                _this._onClickPreviousButton(event);
            }
        });

        $(nextImageBox).bind("click", function(event){
            if($(this).find("a").attr("class") == "arrowNextEnable") {
                _this._onClickNextButton(event);
            }
        });
        return paginationDiv;
    },


    //function to reload datagrid
    reload : function() {
        this._requestData(this._getURL());
    },

    //Getting the URL for request
    _getURL : function() {
        var url = "";
        if (this.options.requestURL != "")
        {
            url = this.options.requestURL + "&page=" + this.options.page + "&page_size=" + this.options.pageSize + "&pageSizeDisplay=" + this.options.pageSizeDisplay + "&sortOrder=" + this.options.sortOrder;
        }
        if (this.options.search.searchedVal != "")
        {
            url = url + "&searchfilter=" + this.options.search.searchedVal;
        }
        if (this.options.sortField != "")
        {
            url = url + "&sortField=" + this.options.sortField;
        }
        return url;
    },

    //Ajax request for getting data
    _requestData : function(url) {
        if (url != "") {
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                context : this,
                success : function(data) {
                    this.options.paginationSide != "Server" ? this.pagination(data) : this.loadData(data);
                }
            });
        }
    },
    //Function for rendering the data
    loadData: function(data) {
        var dataSource = data, headers = [], currentSpanShowing = this.options.pageSpan, lastIndex = "";
        $(this.element).find('.nstcustomtable').length != 0 ? this._removeTable() : "", startingIndex = "";
        this.options.count = dataSource.count;
        //check if the current page does not contain record, then show the previous page.
        if(parseInt(dataSource.count) > 0 && ((((parseInt(this.options.page) - 1) * parseInt(this.options.pageSize)) + 1) > parseInt(dataSource.count))) {
            this.options.page -= 1;
        }
        if (this.options.page != 1) {
            startingIndex = (parseInt(this.options.pageSize)) * (parseInt(this.options.page) - 1) + 1;
        } else {
            startingIndex = 1;
        }
        if (this.options.count == 0) {
            startingIndex = 0;
        }
        if (this.options.count > (parseInt(this.options.pageSize) * parseInt(this.options.page))) {
            lastIndex = (parseInt(this.options.pageSize)) * (parseInt(this.options.page));
        } else {
            lastIndex = this.options.count;
        }
        $(currentSpanShowing).html("Displaying " + startingIndex + "-" + lastIndex + " of " + dataSource.count);
        var tbl = document.createElement("table");
        tbl.setAttribute("class", "nstcustomtable");
        //code added.
        tbl.setAttribute("cellspacing", "0");


        tbl.style.width = this.options.width;
        var tblBody = document.createElement("tbody");
        var rowElement = document.createElement("tr");
        for (var i = 0; i < dataSource.headers.length; i++)
        {
            var cell;
            column = dataSource.headers[i];
            if (column.type == "header") {
                cell = document.createElement("th");
                cell.setAttribute("class", "tableHeader");
                var a = document.createElement("a");
                a.setAttribute("sortField", column.sortField);
                a.setAttribute("class", "columnLabel");
                var cellText = document.createTextNode(column.fieldName);
                headers.push(column.fieldName);
                a.appendChild(cellText);
                cell.appendChild(a);
                var _this = this;
                $(a).bind('click', function(){
                    var sortField = $(this).attr('sortField');
                    _this._onClickHeader(sortField);
                });
                var resizeDiv = document.createElement("div");
                resizeDiv.setAttribute("class", 'resizeHelper ui-resizable-handle ui-resizable-e');
                resizeDiv.innerHTML = "&nbsp;";
                cell.appendChild(resizeDiv);
            }
            rowElement.appendChild(cell);
        }
        if (this.options.addCustomAction.callback != "") {
            cell = document.createElement("th");
            cell.setAttribute("class", "tableHeader");
            var a = document.createElement("a");
            a.setAttribute("sortField", column.sortField);
            a.setAttribute("class", "columnLabel");
            a.setAttribute("width", this.options.addCustomAction.minWidth);
            var cellText = document.createTextNode("Action");
            headers.push("Action");
            a.appendChild(cellText);
            cell.appendChild(a);
            var resizeDiv = document.createElement("div");
            resizeDiv.setAttribute("class", 'resizeHelper ui-resizable-handle ui-resizable-e');
            resizeDiv.innerHTML = "&nbsp;";
            cell.appendChild(resizeDiv);
            rowElement.appendChild(cell);
        }
        this.options.columnHeaders = { "headers" : headers};
        tblBody.appendChild(rowElement);
        tbl.appendChild(tblBody);
        this.element.append(tbl);
        var returnVal;
        if (dataSource.records.length != 0) {
            for (var i = 0; i < dataSource.records.length ; i++)
            {
                var rowIdentifier = "";
                rowElement = document.createElement("tr");
                row = dataSource.records[i];
                for (var j = 0; j < row.length; j++)
                {
                    var cell;
                    column = row[j];
                    if (column.dataType == "date") {
                        var date = new Date(column.fieldName);
                        column.fieldName = date.toLocaleString();
                    }
                    if (column.type == "hyperlink") {
                        cell = document.createElement("td");
                        cell.setAttribute("type", column.type);
                        var a = document.createElement("a");
                        var aText = document.createTextNode(column.fieldName);
                        a.setAttribute("href", column.url);
                        a.appendChild(aText);
                        cell.appendChild(a);
                    } else if (column.type == "onclick") {
                        cell = document.createElement("td");
                        cell.setAttribute("type", column.type);
                        var a = document.createElement("a");
                        var aText = document.createTextNode(column.fieldName);
                        a.setAttribute("href", "#");
                        a.setAttribute("onclick", column.functionName);
                        a.appendChild(aText);
                        cell.appendChild(a);
                    } else if (column.type == "text") {
                        cell = document.createElement("td");
                        cell.setAttribute("type", column.type);
                        if (column.dataType == "bool") {
                            if (column.fieldName == '1') {
                                var cellText = document.createTextNode("Yes");
                                cell.appendChild(cellText);
                            } else {
                                var cellText = document.createTextNode("No");
                                cell.appendChild(cellText);
                            }
                        } else if(column.dataType == "pre") {
                            var pre = document.createElement("pre");
                            var cellText = document.createTextNode(column.fieldName);
                            cell.appendChild(pre);
                            pre.appendChild(cellText);
                        } else {
                            var cellText = document.createTextNode(column.fieldName);
                            cell.appendChild(cellText);
                        }
                    }
                    rowElement.appendChild(cell);
                }
                if (this.options.addCustomAction.callback != "") {
                    var cell = document.createElement("td");
                    this.options.addCustomAction.callback.call(cell, rowIdentifier);
                    rowElement.appendChild(cell);
                }
                tblBody.appendChild(rowElement);
            }
            tbl.appendChild(tblBody);
            this.element.append(tbl);
            this.element.append(this.options.pageSpan);
            this.element.append(this.options.pageSizeDiv);
            this.element.append(this.options.paginationDivLower);

            if (dataSource.previous != null) {
                this.options.pagePreviousUrl = dataSource.previous;
                $(this.element).find(".arrowPrevBox").each( function(){
                    $(this).find("a").attr("class", "arrowPrevEnable");
                });
            } else {
                this._disablePreviousButton();
            }

            if (dataSource.next != null) {
                this.options.pageNextUrl = dataSource.next;
                $(this.element).find(".arrowNextBox").each( function(){
                    $(this).find("a").attr("class", "arrowNextEnable");
                });
            } else {
                this._disableNextButton();
            }

            var _this = this;
            $(this.element).find(".currentPage").each(function(){
                $(this).html(_this.options.page);
            });

            $(this.element).trigger('dataGridReload', this.options.count);
            returnVal = 1;
        } else {
            this._noResultDisplay();
            this.element.append(this.options.pageSpan);
            this.element.append(this.options.pageSizeDiv);
            $(this.element).trigger('dataGridReload', this.options.count);
            returnVal = 0;
        }
        this._onClickResizeableColumn();
        return returnVal;
    },

    //Function for resizing the column
    _onClickResizeableColumn : function()
    {
        var table = $(this.element).find('.nstcustomtable');
        var colElement, colWidth, originalSize;
        var _this = this;
        var updatedSize;
        this.element.find("th").resizable({
            handles: {
                "e": " .resizeHelper"
            },
            containment: "parent",
            create: function(event, ui) {
                    var minWidth = $(this).find(".columnLabel").width();
                    if (minWidth) {
                        minWidth += $(this).find(".ui-resizable-e").width();
                        $(this).resizable("option", "minWidth", minWidth);
                        }
                        else
                        {
                            $(this).resizable("option", "minWidth", 15);
                        }
                    },
            resize: function(event, ui) {
                var updtprntTbl = $(ui.element.parent());
                if (!_this.checkResize(updtprntTbl))
                {
                    $(this).mouseup();
                    $(this).width(updatedSize);
                }
                else
                {
                    if (ui.size.width > ui.originalSize.width)
                    {
                        updatedSize = ui.size.width - 5;
                    }
                    else
                    {
                        updatedSize = ui.size.width + 5;
                    }
                }
            },
        });
    },

    checkResize : function(updatedTable)
    {
        var returnVal = true;
        updatedTable.find("th").each( function() {
            var minWidth,
                columnHeader = $(this).find(".columnLabel");
            if (typeof(columnHeader.attr("width")) != "undefined") {
                minWidth = Number(columnHeader.attr("width"));
                if ($(this).width() <= minWidth) {
                    returnVal = false;
                }
            } else if ( $(this).width() < 15 ) {
                returnVal = false;
            }
        });
        return returnVal;
    },

    //Sorting the String if pagination is at Server
    _sortNumber : function(array, position, order)
    {
        array.sort(function(a, b){
                var returnVal = parseInt(a[position].fieldName) - parseInt(b[position].fieldName);
                return (order * returnVal);

        });
        return array;
    },
    //Sorting the String if pagination is at Client
    _sortString : function(array, position, order)
    {
        array.sort(function(a, b){
                var returnVal = a[position].fieldName.localeCompare(b[position].fieldName);
                return (order * returnVal);

        });
        return array;
    },

    //Getting value of sortOrder
    getSortOrderValue : function()
    {
        return this.options.sortOrder == 'descending' ? -1 : 1;
    },

    //Click Handler for the header of the Data Grid
    _onClickHeader : function (sortField)
    {
        var gridName = ($(this.element).attr("id"));
        this.options.selectCheckedIdentifierStatus = false;
        this.options.sortOrder = this.options.sortField == sortField ? this.options.sortOrder = this.options.sortOrder == 'descending' ? 'ascending' : 'descending' : 'ascending';
        this.options.sortField = sortField;
        if (this.options.paginationSide == "Server") {
            this._requestData(this._getURL());
        } else {
            var sortedData = this._sortClientSideData(this.options.currentQuerySet);
            this.options.currentQuerySet = sortedData;
            this._paginateData(sortedData);
        }
    },

    _sortClientSideData : function(data)
    {
        var recordArray = data.records,
            position = 0;
        if (this.options.sortField != "") {
            var order = this.getSortOrderValue();
            for (var i = 0; i < data.headers.length; i++)
            {
                if (this.options.sortField == data.headers[i].sortField) {
                    position = i;
                    break;
                }
            }

            if (data.headers[position].dataType == "date" || data.headers[position].dataType == "number") {
                recordArray = this._sortNumber(recordArray, position, order)
            } else {
                recordArray = this._sortString(recordArray, position, order)
            }
        }
        return {count : recordArray.length, headers : data.headers, records : recordArray, previous : data.previous, next : data.next};
    },
    //If No Data is Received
    _noResultDisplay : function ()
    {
        var searchedValueElement = $(this.element).find(".searchTxtBox");
        searchedValue = $(searchedValueElement).val();
        var noResult = document.createElement("div");
        noResult.setAttribute("class", "no_results");
        if (searchedValue != "") {
            var noResultDisplay = document.createElement("span");
            noResultDisplay.innerHTML = 'No Results Found';
        } else {
            var noResultDisplay = document.createElement("span");
            noResultDisplay.innerHTML = 'No Records';
        }
        noResult.appendChild(noResultDisplay);
        this.element.append(noResult);
    },
    //Saving data for pagination and can be called from the template
    pagination : function(data){
        this.options.dataForPagination = data;
        var sortedData = this._sortClientSideData(data);
        this.options.currentQuerySet = sortedData;
        this._paginateData(sortedData);
    },

    //Paginating the Data
    _paginateData : function(paginationData){
        if (this.options.pageSize == -1) {
            this.options.pageSize = paginationData.count;
        }
        //check if the current page does not contain record, then show the previous page.
        if(parseInt(paginationData.count) > 0 && ((((parseInt(this.options.page) - 1) * parseInt(this.options.pageSize)) + 1) > parseInt(paginationData.count))) {
            this.options.page -= 1;
        }
        var startingIndex = ((parseInt(this.options.page) - 1) * parseInt(this.options.pageSize)) + 1,
            lastIndex = (parseInt(this.options.page)) * parseInt(this.options.pageSize),
            data = [],
            prev = this.options.page == '1' ? null : "#",
            nex = lastIndex >= paginationData.count ? null : "#";
        for (var i = startingIndex; i <= lastIndex && i<=paginationData.count; i++)
        {
            data.push(paginationData.records[i-1]);
        }
        this.loadData({
            count : paginationData.count,
            headers : paginationData.headers,
            records : data,
            previous : prev,
            next:nex
        });
    },

    //Click handler for the search
    _onClickSearch : function(event){
        var searchedValueElement = $(this.element).find(".searchTxtBox"),
            searchedValue = $(searchedValueElement).val();
        this.options.search.searchedVal = searchedValue;
        this.options.selectCheckedIdentifierStatus = false;
        //check if user clicked the search button, if yes then set page to '1'.
        //Else grid will be refreshed with searched data on the same page.
        if(event != undefined && event.hasOwnProperty('originalEvent')) {
            event.preventDefault();
            this.options.page = 1;
        }
        if (this.options.paginationSide == "Server") {
            this._requestData(this._getURL());
        } else {
            if (searchedValue == "") {
                this.options.currentQuerySet = this.options.dataForPagination;
                this._paginateData(this.options.currentQuerySet);
            } else {
                var recordArray = this.options.dataForPagination.records,
                    patt = new RegExp(searchedValue,"i");
                var recordArray = jQuery.grep(recordArray, function( n, i ) {
                    for (var j = 0; j < n.length; j++)
                    {
                        if (patt.test(n[j].fieldName)) {
                            return 1;
                        }
                    }
                    return 0;
                });
                var data = {count:recordArray.length,headers:this.options.dataForPagination.headers,records:recordArray,previous:this.options.dataForPagination.previous,next:this.options.dataForPagination.next};
                this.options.currentQuerySet = data;
                this._paginateData(data);
            }
        }
    },

    //Click handler for the Next Button
    _onClickNextButton : function(e) {
        if(e != undefined && e.hasOwnProperty('originalEvent')) {
            this.options.selectCheckedIdentifierStatus = false;
        }
        this._disablePreviousButton();
        this._disableNextButton();
        if (this.options.paginationSide == "Server") {
            this._requestData(this.options.pageNextUrl);
            this.options.page = parseInt(this.options.page) + 1;
        } else {
            this.options.page = parseInt(this.options.page) + 1;
            this._paginateData(this.options.currentQuerySet);
        }

    },

    _disablePreviousButton : function() {
        $(this.element).find(".arrowPrevBox").each( function(){
            $(this).find("a").attr("class", "arrowPrev");
        });
    },

    _disableNextButton : function() {
        $(this.element).find(".arrowNextBox").each( function(){
            $(this).find("a").attr("class", "arrowNext");
        });
    },

    _onClickPreviousButton : function(e){
        if(e.hasOwnProperty('originalEvent')) {
            this.options.selectCheckedIdentifierStatus = false;
        }
        this._disablePreviousButton();
        this._disableNextButton();
        if (this.options.paginationSide == "Server") {
            this._requestData(this.options.pagePreviousUrl);
            this.options.page = parseInt(this.options.page) - 1;
        } else {
            this.options.page = parseInt(this.options.page) - 1;
            this._paginateData(this.options.currentQuerySet);
        }
    },

    _onChangeSelectPageSize : function(){
        var currentPageSize = $(this.element).find(".pageValue");
        this.options.pageSize = $(currentPageSize).val();
        if (this.options.paginationSide != "Server") {
            this._paginateData(this.options.currentQuerySet);
        } else {
            var totalPages = parseInt(this.options.count) / parseInt(this.options.pageSize);
            if (totalPages < (parseInt(this.options.page))) {
                this.options.page = Math.ceil(totalPages);
            }
            this._requestData(this._getURL());
        }
    },
    _gridFormatData : function(headers, data){

    },
    // Removing the data from the grid
    _removeTable : function() {
        var datatable = $(this.element).find('.nstcustomtable');
        $(datatable).remove();
        $(this.element).find('.no_results').remove();
        this.options.paginationDivLower.remove();
    },

    //Destroying table from the Data Grid.
    destroy : function() {
        $.Widget.prototype.destroy.call( this );
    }

};
$.widget( "Custom.GridWidget", GridWidget);
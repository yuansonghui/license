(function($){
    var $licenseTypeCheckbox = $('input[name=license-type]');
    var $versionBox = $('select[name=version]');
    var $snBox = $('input[name=sn]');
    var $machineidBox = $('input[name=machineid]');
    var $capacityBox = $('input[name=capacity]');
    var $licenseTypeBox =  $('select[name=license_type]');
    var $errorMessage = $('.error-message');
    var $featureType = $('.feature-type');
    var $featureLicense = $('.feature-license');
    var $checkAll = $('input[name=check-all]');
    var $licenseValue = $('.license-value');
    var $omFeatureClusterNodes = $('.om-feature-cluster-nodes');
    var $omFeatureClusterNodeCheckbox = $omFeatureClusterNodes.find('[type=checkbox]');
    var $snWrap = $('.sn-wrap');
    var $activeTimeWrap = $('.active-time-wrap');
    var $timeLicenseWrap = $('.time-license-wrap');
    var $activeTime = $activeTimeWrap.find('select');
    var $activeTimeCheckbox = $activeTimeWrap.find('input[type=checkbox]');
    var $indefiniteDurationWrap = $('.indefinite-duration-wrap');
    var $omFeatureClusterNodeRadio = $('input[name=clusterNodes]');
    var $systemLicenseRadio = $('input[name=systemLicense]');
    var $authCap = $('.authcap');
    var $subNav = $('.sub-nav');

    function getTimeLicense(type) {
        return type == 'time';
    }

    function getActiveTime() {
        if($activeTimeCheckbox[0].checked) {
            return 99;
        }
        return $activeTime[0].value + '' + $activeTime[1].value;
    }

    function getCapacity(value) {
        if(value < 10 && value >= 0) {
            return 0 + '' + value;
        }
        return value;
    }

    function getParmes() {
        var license_type = getInputValue($licenseTypeBox);
        var params = {}
        var version = getInputValue($versionBox);
        if(getTimeLicense(license_type)) {
            params = {
                version: version,
                machineid: getInputValue($machineidBox),
                active_time: getActiveTime(),
                capacity: getCapacity(Number(getInputValue($capacityBox)))
            }
            if(isSnSHow(version)){
                params.sn = getInputValue($snBox);
            }
            if(version == '2.9.1') {
                params.license_type = 'time';
            }
        }else{
            params = {
                sn:  getInputValue($snBox),
                version: version,
                license_type: license_type,
                feature_ids: getFeatureIds(license_type)
            }
        }
        return params;
    }

    function getInputValue(selector) {
        if(!selector) {
            return '';
        }
        return selector.val();
    }

    function getFeatureIds(licenseType) {
        var feature_ids = [];
        if(licenseType !== 'feature'){
            return [];
        }
        for(var i=0;i < $licenseTypeCheckbox.length;i++) {
            if($licenseTypeCheckbox[i].checked) {
                feature_ids.push($licenseTypeCheckbox[i].value)
            }
        }
        return feature_ids;
    }

    function getLicense(params) {
        var url = '/license/register';
        jQuery.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(params),
            contentType: 'application/json',
            success: function(data) {
                $licenseValue.show();
                $licenseValue.find('input').val(JSON.parse(data).license); 
            },
            error: function(err) {
                $licenseValue.find('input').val('');
                $licenseValue.hide();
            }
        })

    }

    var validators = {
        sn: function(value) {
            if(!value) {
                return false
            }
            return true;
        },
        version: function(value) {
            if(!value) {
                return false
            }
            return true;
        },
        license: function(value) {
            if(!value) {
                return false
            }
            return true;
        },
        featureIds: function(value) {
            if(!value.length) {
                return false
            }
            return true;
        },
        machineid: function(value) {
            if(!value.length) {
                return false
            }
            return true;
        },
        activeTime: function(value) {
            if(value <= 0) {
                return false
            }
            return true;
        },
        capacity: function(value) {
            if(value < 0 || value > 99) {
                return false
            }
            return true;
        },
        bigCapacity: function(value) {
            if(value < 0 || value > 1295) {
                return false
            }
            return true;
        }
    }

    var licenseGroup = {
        standardLicense: ["OM_FEATURE_OSD_CACHE", "RBD_FEATURE_ISCSI"],
        advancedLicense: ["RBD_FEATURE_KRBD", "OM_FEATURE_PHYSICAL_POOL", "OM_FEATURE_OSD_CACHE", "RBD_FEATURE_ISCSI","OM_FEATURE_USERS_MANAGER","OM_FEATURE_CLUSTER_NODES_16"],
        flagshipLicense: ["OM_FEATURE_RACK_DETECH","RBD_FEATURE_QOS","RBD_FEATURE_KRBD","OM_FEATURE_PHYSICAL_POOL","OM_FEATURE_USERS_MANAGER","OM_FEATURE_OSD_CACHE","OM_FEATURE_SNMP","OTHERS_FEATURE_RGW","RBD_FEATURE_ISCSI","OM_FEATURE_CLUSTER_NODES_all","RBD_FEATURE_LUN_MASKING","OTHERS_FEATURE_VERSION_INFO","OTHERS_FEATURE_NFS","RBD_FEATURE_FC"],
        customizedLicense: []
    };

    var OM_FEATURE_CLUSTER_NODES = ['OM_FEATURE_CLUSTER_NODES_16', 'OM_FEATURE_CLUSTER_NODES_all', ''];    

    function validate(params) {
        var licenseType = getInputValue($licenseTypeBox);
        var isGetTimeLicense = getTimeLicense(getInputValue($licenseTypeBox));
        var version = getInputValue($versionBox);

        if(isSnSHow(version) && !validators.sn(params.sn)) {
            paramsError = 'sn不能为空';
            return paramsError;
        }
        if(!validators.version(params.version)) {
            paramsError = '版本不能为空';
            return paramsError;
        }

        if(!isGetTimeLicense && !validators.license(params.license_type)) {
            paramsError = '类型不能为空';
            return paramsError;
        }

        if(!isGetTimeLicense && !validators.featureIds(params.feature_ids)) {
            paramsError = '特性licens类型不能为空';
            return paramsError;
        }

        if(isGetTimeLicense && !validators.activeTime(params.active_time)) {
            paramsError = '有效期不能为空';
            return paramsError;
        }
        
        if(isGetTimeLicense && !isBigCapacity(licenseType,version) && !validators.capacity(params.capacity)) {
            if (version!='mos'){
            paramsError = '容量在0-99之间';
            return paramsError;
            }
        }

        if(isGetTimeLicense && isBigCapacity(licenseType,version) && !validators.bigCapacity(params.capacity)) {
            paramsError = '容量在0-1295之间';
            return paramsError;
        }
        return false;
    }

    function isBigCapacity(license_type,version){
        return getTimeLicense(license_type) && ['2.7.6'].indexOf(version) != -1;
    }

    $('.get-license').on('click',function(event){
        var params = getParmes();
        var errorMessage = validate(params);
        if(!errorMessage) {
            getLicense(params);
            $errorMessage.hide();
        }else{
            $errorMessage.show().html(errorMessage);
        }
    })

    $licenseTypeBox.on('change',function(event){
        changeLicenseType($(this).val());
    })

    function changeLicenseType(licenseType) {
        if(licenseType == 'feature') {
            $featureType.show();
            $timeLicenseWrap.hide();
        }else{
            $featureType.hide();
            $timeLicenseWrap.show();
        }
    }

    function isSnSHow(version) {
        return version !== '2.7.3';
    }

    function isFeaturnLicenseShow(version) {
        return version == '2.9.1';
    }  

    $versionBox.on('change',function(event){
        var version = $(this).val();
        if(isSnSHow(version)) {
            $indefiniteDurationWrap.show();
            $snWrap.show()
        }else{
            $indefiniteDurationWrap.show();            
            $snWrap.hide();
        }
        if(isFeaturnLicenseShow(version)) {
            $featureLicense.show();
            $('select[name=license_type]')[0].value = 'feature';
        }else{
            $featureLicense.hide();
            $('select[name=license_type]')[0].value = 'time';            
        }
        changeLicenseType($('select[name=license_type]')[0].value);   
        
        var warning =getAutoCapWarning(version) + '2.7.6的license不能用于2.7.5,2.7.5的license不能用于2.7.3,2.7.3的可以用于2.7.3及之前版本'
        $authCap.html(warning);
    })

    function getAutoCapWarning(version) {
        if(['2.7.3','2.7.5'].indexOf(version) != -1) {
            return 'AuthCap(0-99 TB),'
        }
        return 'AuthCap(0-1295 TB),'
    }

    function setLicenseCheck(type) {
        var lisenceTypes = licenseGroup[type];
        var isCheckboxDisabled = type == 'customizedLicense';
        if(!isCheckboxDisabled) {
            $licenseTypeCheckbox.attr('disabled','disabled');
            $checkAll.attr('disabled','disabled');
        }else {
            $licenseTypeCheckbox.removeAttr('disabled');
            $checkAll.removeAttr('disabled');            
        }
        for(var i= 0; i < $omFeatureClusterNodeRadio.length; i++) {
            $omFeatureClusterNodeRadio[i].checked = false;
        }   
        for(var i=0;i < $licenseTypeCheckbox.length;i++) {
            if(lisenceTypes.indexOf($licenseTypeCheckbox[i].value)!= -1) {
                $licenseTypeCheckbox[i].checked = true;
            }else {
                $licenseTypeCheckbox[i].checked = false;                
            }
        }
    }

    $checkAll.on('change',function(event){
        for(var i=0;i < $licenseTypeCheckbox.length;i++) {
            $licenseTypeCheckbox[i].checked = $(this)[0].checked;
            console.log($licenseTypeCheckbox[i])
            
        }
        if($(this)[0].checked) {
            $omFeatureClusterNodeRadio[0].checked = true;
            $omFeatureClusterNodeCheckbox.val('OM_FEATURE_CLUSTER_NODES_16');
        }else{
            for(var i= 0; i < $omFeatureClusterNodeRadio.length; i++) {
                $omFeatureClusterNodeRadio[i].checked = false;
            }
            $omFeatureClusterNodeCheckbox.val('');            
        }
    })

    $omFeatureClusterNodeRadio.on('click',function(event){
        event.stopPropagation && event.stopPropagation();
        var $checkedRadio = $('input[name=clusterNodes]:checked');
        if($checkedRadio.length) {
            setFeatureClusterNodeValue($(this)[0],$checkedRadio.val());
        }
        $subNav.hide();
    })

    function setFeatureClusterNodeValue(selecter,value) {
        $omFeatureClusterNodeCheckbox.val(value);
        $omFeatureClusterNodeCheckbox[0].checked = value.length > 0;
        selecter.checked = true;
    }

    setLicenseCheck('standardLicense');
    $systemLicenseRadio.on('click', function(event){
        var $this = $(this);
        var index = ['advancedLicense','flagshipLicense'].indexOf($this[0].value);
        if(index != -1) {
            setFeatureClusterNodeValue($omFeatureClusterNodeRadio[index],OM_FEATURE_CLUSTER_NODES[index]);
        }else {
            setFeatureClusterNodeValue($omFeatureClusterNodeRadio[2],'');
        }

        if($this.value == 'flagshipLicense') {
            setFeatureClusterNodeValue("OM_FEATURE_CLUSTER_NODES_16")
        }
        setLicenseCheck($this[0].value);
    })

    $omFeatureClusterNodeCheckbox.on('click',function(event){    
        var $this = $(this);
        event.stopPropagation && event.stopPropagation();
        $subNav.show();
        if(!$('input[name=clusterNodes]:checked').length) {
            $this[0].checked = false;
        }else{
            $this[0].checked = true;
        }

        if(!$this[0].checked) {
            for(var i= 0; i < $omFeatureClusterNodeRadio.length; i++) {
                $omFeatureClusterNodeRadio[i].checked = false;
            }
            $this[0].checked = false;
            return;
        }
    })

    $authCap.html(getAutoCapWarning('2.9.1') + '2.7.6的license不能用于2.7.5,2.7.5的license不能用于2.7.3,2.7.3的可以用于2.7.3及之前版本');
    
})(jQuery);

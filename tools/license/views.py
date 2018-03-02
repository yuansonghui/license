# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse
from django.core import serializers
import simplejson
import json
import commands
import re
from log import logger

feature_type = {
    "RBD_FEATURE_ISCSI": 1<<0,
    "RBD_FEATURE_KRBD" : 1<<1,
    "RBD_FEATURE_LUN_MASKING" : 1<<2,
    "RBD_FEATURE_QOS" : 1<<3,
    "OM_FEATURE_OSD_CACHE": 1<<4,
    "OM_FEATURE_SNMP": 1<<5,
    "OM_FEATURE_USERS_MANAGER": 1<<6,
    "OM_FEATURE_RACK_DETECH": 1<<7,
    "OM_FEATURE_PHYSICAL_POOL": 1<<8,
    "OM_FEATURE_CLUSTER_NODES_all": 3<<9,
    "OM_FEATURE_CLUSTER_NODES_16": 1<<9,
    "OTHERS_FEATURE_RGW": 1<<11,
    "OTHERS_FEATURE_VERSION_INFO": 1<<12,
    "OTHERS_FEATURE_NFS": 1<<13,
    "RBD_FEATURE_FC": 1<<14
}



def index(request):
    return render(request, 'index.html')


def register(request):
    req_body = json.loads(request.body)
    version = req_body.get('version')
    sn = req_body.get('sn')
    license_type = req_body.get('license_type')
    feature_ids = req_body.get('feature_ids', [])
    machineid = req_body.get('machineid')
    active_time = req_body.get('active_time')
    capacity = req_body.get('capacity')
    
    try:
        if version.startswith('2.7'):
            license = sandstone_version[version](sn, machineid, active_time,capacity)
        elif 'mos' in version:
            license = sandstone_version['2.7.6'](sn, machineid, active_time,capacity)
        else:
            license = sandstone_version[version](version, sn,machineid, active_time,capacity ,license_type, feature_ids)
        data = {"license": license}
    
    except Exception, e:
        logger.error("Error: %s", e)
        return HttpResponse(simplejson.dumps({"license":e}))
    
    return HttpResponse(simplejson.dumps(data, ensure_ascii=False))

def register_2_9_1(version, sn, machineid, active_time, capacity, license_type, feature_ids=[]):
    print license_type
    if license_type == 'time':
        # todo time license
        args = '/root/License_2.9 -k {0} {1} {2} {3}'.format(sn, machineid, active_time,capacity)
        print args
        code, out = commands.getstatusoutput(args)
        print out
        license = re.findall(c,out)[0]
        return license
    if len(feature_ids) == len(feature_type.keys()):
        feature_char = 'ffffffff'
    else:
        feature_char_10 = 0
        for feature in feature_ids:
            if feature not in feature_type.keys():
                return 'is a error feature type'
            feature_char_10 = feature_type[feature] | feature_char_10
        if "OTHERS_FEATURE_NFS" in feature_ids and "RBD_FEATURE_KRBD" not in feature_ids:
            feature_char_10 = feature_type["RBD_FEATURE_KRBD"] | feature_char_10
        feature_char = hex(feature_char_10).split('0x')[-1]
    if len(feature_char) < 8:
        feature_char = '0'*(8-len(feature_char)) + feature_char
    three_num = sn[0:3]
    args = '/root/License_2.9 -f {0} 0{1}{2}'.format(sn, feature_char, three_num)
    code, out = commands.getstatusoutput(args)
    first_license = out.split()[-1]
    last_args = '/root/License_2.9 -f {0} 1{1}{2}'.format(sn,feature_char,three_num)
    code, out = commands.getstatusoutput(last_args)
    second_license = out.split()[-1]
    return '{0}-{1}'.format(first_license, second_license)
   
c=re.compile('the License Key is:\s+(\S+)')

def register_2_7_6(sn,machineid,active_time,capacity):
    args = '/root/license.2.7.6 -k {0} {1} {2} {3}'.format(sn, machineid, active_time,capacity)
    logger.info(args)
    code, out = commands.getstatusoutput(args)
    logger.info(out)
    license = re.findall(c,out)[0]
    return license 

def register_2_7_5(sn,machineid,active_time,capacity):
    args = '/root/license.2.7.5_i -k {0} {1} {2} {3}'.format(sn, machineid, active_time,capacity)
    print args
    code, out = commands.getstatusoutput(args)
    print out
    license = re.findall(c,out)[0]
    return license 

def register_2_7_3(sn,machineid,active_time,capacity):
    args = '/root/license.2.7 -k {0} {1} {2}'.format(machineid, active_time,capacity)
    print args
    code, out = commands.getstatusoutput(args)
    print out
    license = re.findall(c,out)[0]
    return license 

sandstone_version = {'2.9.1': register_2_9_1,'2.7.6': register_2_7_6,'2.7.5': register_2_7_5, '2.7.3': register_2_7_3}

package com.bus.occupancy.system.mapper;

import com.bus.occupancy.system.dto.BusDetailResponse;
import com.bus.occupancy.system.dto.BusSummaryDto;
import com.bus.occupancy.system.dto.OccupancyLogResponseDTO;
import com.bus.occupancy.system.model.Bus;
import com.bus.occupancy.system.model.BusStatus;
import com.bus.occupancy.system.model.OccupancyLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Bus entity'sinden DTO'lara tip guvenli donusum.
 * componentModel = "spring" → Spring bean olarak otomatik kayit edilir.
 *
 * Lombok ile birlikte calismasi icin pom.xml'de annotation processor sirasi
 * lombok → mapstruct seklinde olmalidir.
 */
@Mapper(componentModel = "spring", imports = BusStatus.class)
public interface BusMapper {

    @Mapping(target = "activePassengerCount", source = "busOccupancy")
    @Mapping(target = "occupancyRate",        expression = "java(bus.getOccupancyRate())")
    @Mapping(target = "status",               expression = "java(bus.getStatus() != null ? bus.getStatus() : BusStatus.ON_TIME)")
    @Mapping(target = "lastUpdatedAt",        source = "updatedAt")
    BusSummaryDto toSummaryDto(Bus bus);

    @Mapping(target = "activePassengerCount", source = "bus.busOccupancy")
    @Mapping(target = "occupancyRate",        expression = "java(bus.getOccupancyRate())")
    @Mapping(target = "status",               expression = "java(bus.getStatus() != null ? bus.getStatus() : BusStatus.ON_TIME)")
    @Mapping(target = "lastUpdatedAt",        source = "bus.updatedAt")
    @Mapping(target = "id",                   source = "bus.id")
    @Mapping(target = "lineCode",             source = "bus.lineCode")
    @Mapping(target = "routeName",            source = "bus.routeName")
    @Mapping(target = "plateNumber",          source = "bus.plateNumber")
    @Mapping(target = "fleetCode",            source = "bus.fleetCode")
    @Mapping(target = "currentStop",          source = "bus.currentStop")
    @Mapping(target = "destination",          source = "bus.destination")
    @Mapping(target = "maxCapacity",          source = "bus.maxCapacity")
    @Mapping(target = "delayInMinutes",       source = "bus.delayInMinutes")
    @Mapping(target = "driverName",           source = "bus.driverName")
    @Mapping(target = "occupancyList",        source = "occupancyList")
    BusDetailResponse toDetailResponse(Bus bus, List<OccupancyLogResponseDTO> occupancyList);

    @Mapping(target = "createdAt", source = "createdAt")
    OccupancyLogResponseDTO toOccupancyLogDto(OccupancyLog log);

    List<BusSummaryDto> toSummaryDtoList(List<Bus> buses);
}
